-- ============================================
-- AMS TOKEN - SUPABASE DATABASE SCHEMA
-- ============================================
-- Копирай и изпълни в Supabase SQL Editor
-- ============================================

-- 1. ТАБЛИЦА ЗА DONORS (Дарители)
CREATE TABLE IF NOT EXISTS donors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text UNIQUE NOT NULL,
    name text,
    email text,
    phone text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 2. ТАБЛИЦА ЗА DONATIONS (Дарения)
CREATE TABLE IF NOT EXISTS donations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    donor_name text,
    donor_email text,
    donor_phone text,
    bnb_amount numeric NOT NULL CHECK (bnb_amount > 0),
    tokens_to_receive numeric NOT NULL CHECK (tokens_to_receive > 0),
    tx_hash text,
    variant text CHECK (variant IN ('A', 'B')), -- А = ръчно, Б = автоматично
    notes text,
    processed boolean DEFAULT false,
    queue_position integer,
    created_at timestamp DEFAULT now(),
    processed_at timestamp,
    FOREIGN KEY (wallet_address) REFERENCES donors(wallet_address) ON DELETE CASCADE
);

-- 3. ТАБЛИЦА ЗА TRANSFERS (Трансфери от owner)
CREATE TABLE IF NOT EXISTS transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_address text NOT NULL, -- owner address
    to_address text NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    balance_before numeric NOT NULL,
    balance_after numeric NOT NULL,
    tx_hash text NOT NULL UNIQUE,
    donor_name text,
    donor_email text,
    donor_phone text,
    created_at timestamp DEFAULT now()
);

-- 4. ТАБЛИЦА ЗА BURNS (Изгаряния на токени)
CREATE TABLE IF NOT EXISTS burns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    amount numeric NOT NULL CHECK (amount > 0),
    burn_type text NOT NULL CHECK (burn_type IN ('scheduled', 'manual')),
    total_supply_before numeric NOT NULL,
    total_supply_after numeric NOT NULL,
    tx_hash text NOT NULL UNIQUE,
    notes text,
    created_at timestamp DEFAULT now()
);

-- 5. ТАБЛИЦА ЗА TRADING HISTORY (История на търговия)
CREATE TABLE IF NOT EXISTS trades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    ams_amount numeric NOT NULL CHECK (ams_amount > 0),
    bnb_amount numeric NOT NULL CHECK (bnb_amount > 0),
    price numeric NOT NULL CHECK (price > 0), -- BNB per AMS
    tx_hash text NOT NULL UNIQUE,
    created_at timestamp DEFAULT now()
);

-- 6. ТАБЛИЦА ЗА EMAIL LOGS (Лог на имейли)
CREATE TABLE IF NOT EXISTS email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient text NOT NULL,
    subject text NOT NULL,
    body text,
    status text NOT NULL CHECK (status IN ('sent', 'failed')),
    error_message text,
    created_at timestamp DEFAULT now()
);

-- 7. ТАБЛИЦА ЗА ADMIN ACTIONS (Лог на админ действия)
CREATE TABLE IF NOT EXISTS admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_address text NOT NULL,
    action_type text NOT NULL, -- mint, burn, transfer, pause, etc.
    details jsonb,
    tx_hash text,
    success boolean DEFAULT true,
    error_message text,
    created_at timestamp DEFAULT now()
);

-- ============================================
-- ИНДЕКСИ ЗА ПО-БЪРЗИ ЗАЯВКИ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_donations_wallet ON donations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_donations_processed ON donations(processed);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_variant ON donations(variant);

CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_transfers_created ON transfers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_burns_type ON burns(burn_type);
CREATE INDEX IF NOT EXISTS idx_burns_created ON burns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_type ON trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_address);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE burns ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (Права за достъп)
-- ============================================

-- Публичен достъп за четене на donations (за public страниците)
DROP POLICY IF EXISTS "Public read donations" ON donations;
CREATE POLICY "Public read donations" ON donations
    FOR SELECT USING (true);

-- Публичен достъп за insert на donations (за public donation форма)
DROP POLICY IF EXISTS "Public insert donations" ON donations;
CREATE POLICY "Public insert donations" ON donations
    FOR INSERT WITH CHECK (true);

-- Публичен достъп за donors
DROP POLICY IF EXISTS "Public upsert donors" ON donors;
CREATE POLICY "Public upsert donors" ON donors
    FOR ALL USING (true);

-- Само service_role може да update donations (от backend functions)
DROP POLICY IF EXISTS "Service role update donations" ON donations;
CREATE POLICY "Service role update donations" ON donations
    FOR UPDATE USING (auth.role() = 'service_role');

-- Публичен четене на transfers (за transparency)
DROP POLICY IF EXISTS "Public read transfers" ON transfers;
CREATE POLICY "Public read transfers" ON transfers
    FOR SELECT USING (true);

-- Само service_role може да insert transfers
DROP POLICY IF EXISTS "Service role insert transfers" ON transfers;
CREATE POLICY "Service role insert transfers" ON transfers
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Публичен достъп за четене на burns
DROP POLICY IF EXISTS "Public read burns" ON burns;
CREATE POLICY "Public read burns" ON burns
    FOR SELECT USING (true);

-- Публичен достъп за четене на trades
DROP POLICY IF EXISTS "Public read trades" ON trades;
CREATE POLICY "Public read trades" ON trades
    FOR SELECT USING (true);

-- Само service_role за email_logs и admin_actions
DROP POLICY IF EXISTS "Service role email logs" ON email_logs;
CREATE POLICY "Service role email logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role admin actions" ON admin_actions;
CREATE POLICY "Service role admin actions" ON admin_actions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- VIEWS (За по-лесни заявки)
-- ============================================

-- View за pending donations с donor информация
CREATE OR REPLACE VIEW pending_donations AS
SELECT 
    d.id,
    d.wallet_address,
    d.donor_name,
    d.donor_email,
    d.donor_phone,
    d.bnb_amount,
    d.tokens_to_receive,
    d.tx_hash,
    d.variant,
    d.notes,
    d.created_at,
    ROW_NUMBER() OVER (ORDER BY d.created_at) as queue_position
FROM donations d
WHERE d.processed = false
ORDER BY d.created_at ASC;

-- View за статистики
CREATE OR REPLACE VIEW donation_stats AS
SELECT
    COUNT(*) FILTER (WHERE processed = false) as pending_count,
    COUNT(*) FILTER (WHERE processed = true) as processed_count,
    SUM(bnb_amount) FILTER (WHERE processed = false) as pending_bnb_total,
    SUM(bnb_amount) FILTER (WHERE processed = true) as processed_bnb_total,
    SUM(tokens_to_receive) FILTER (WHERE processed = false) as pending_tokens_total,
    SUM(tokens_to_receive) FILTER (WHERE processed = true) as processed_tokens_total,
    COUNT(*) FILTER (WHERE processed = true AND DATE(processed_at) = CURRENT_DATE) as processed_today
FROM donations;

-- ============================================
-- FUNCTIONS (Полезни функции)
-- ============================================

-- Функция за вземане на следващо pending donation
CREATE OR REPLACE FUNCTION get_next_pending_donation()
RETURNS TABLE (
    id uuid,
    wallet_address text,
    donor_name text,
    donor_email text,
    donor_phone text,
    bnb_amount numeric,
    tokens_to_receive numeric,
    tx_hash text,
    variant text,
    created_at timestamp
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.wallet_address,
        d.donor_name,
        d.donor_email,
        d.donor_phone,
        d.bnb_amount,
        d.tokens_to_receive,
        d.tx_hash,
        d.variant,
        d.created_at
    FROM donations d
    WHERE d.processed = false
    ORDER BY d.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS (Автоматични действия)
-- ============================================

-- Auto-update updated_at за donors
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_donors_updated_at ON donors;
CREATE TRIGGER update_donors_updated_at
    BEFORE UPDATE ON donors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (За тестване - премахни в production)
-- ============================================

-- Вмъкни примерни donors (само за тестване!)
/*
INSERT INTO donors (wallet_address, name, email, phone) VALUES
('0x1234567890123456789012345678901234567890', 'Тест Донор 1', 'test1@example.com', '+359888123456'),
('0x2345678901234567890123456789012345678901', 'Тест Донор 2', 'test2@example.com', '+359888234567'),
('0x3456789012345678901234567890123456789012', 'Анонимен', 'anonymous@anonymous.com', '---');

-- Вмъкни примерни donations (само за тестване!)
INSERT INTO donations (wallet_address, donor_name, donor_email, donor_phone, bnb_amount, tokens_to_receive, variant, processed) VALUES
('0x1234567890123456789012345678901234567890', 'Тест Донор 1', 'test1@example.com', '+359888123456', 0.1, 1000, 'A', false),
('0x2345678901234567890123456789012345678901', 'Тест Донор 2', 'test2@example.com', '+359888234567', 0.5, 5000, 'B', false),
('0x3456789012345678901234567890123456789012', 'Анонимен', 'anonymous@anonymous.com', '---', 0.05, 500, 'A', true);
*/

-- ============================================
-- ГОТОВО!
-- ============================================

SELECT 'Database schema created successfully!' as message;
