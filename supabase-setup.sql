-- ========================================
-- AMS TOKEN - SUPABASE DATABASE SETUP
-- ========================================
-- Copy this SQL and run it in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

-- 1. DONORS TABLE
CREATE TABLE IF NOT EXISTS donors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text UNIQUE NOT NULL,
    name text,
    email text,
    phone text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 2. DONATIONS TABLE
CREATE TABLE IF NOT EXISTS donations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    donor_name text,
    donor_email text,
    donor_phone text,
    bnb_amount numeric NOT NULL,
    tokens_to_receive numeric NOT NULL,
    tx_hash text,
    variant text CHECK (variant IN ('A', 'B')),
    notes text,
    processed boolean DEFAULT false,
    queue_position integer,
    created_at timestamp DEFAULT now(),
    processed_at timestamp
);

-- 3. TRANSFERS TABLE
CREATE TABLE IF NOT EXISTS transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_address text NOT NULL,
    to_address text NOT NULL,
    amount numeric NOT NULL,
    balance_before numeric NOT NULL,
    balance_after numeric NOT NULL,
    tx_hash text NOT NULL,
    donor_name text,
    donor_email text,
    donor_phone text,
    created_at timestamp DEFAULT now()
);

-- 4. BURNS TABLE
CREATE TABLE IF NOT EXISTS burns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    amount numeric NOT NULL,
    burn_type text CHECK (burn_type IN ('scheduled', 'manual')),
    total_supply_before numeric NOT NULL,
    total_supply_after numeric NOT NULL,
    tx_hash text NOT NULL,
    created_at timestamp DEFAULT now()
);

-- 5. TRADES TABLE
CREATE TABLE IF NOT EXISTS trades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    trade_type text CHECK (trade_type IN ('buy', 'sell')),
    ams_amount numeric NOT NULL,
    bnb_amount numeric NOT NULL,
    price numeric NOT NULL,
    tx_hash text NOT NULL,
    created_at timestamp DEFAULT now()
);

-- 6. EMAIL LOGS TABLE
CREATE TABLE IF NOT EXISTS email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient text NOT NULL,
    subject text NOT NULL,
    body text,
    status text CHECK (status IN ('sent', 'failed')),
    error_message text,
    created_at timestamp DEFAULT now()
);

-- 7. ADMIN ACTIONS TABLE
CREATE TABLE IF NOT EXISTS admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_address text NOT NULL,
    action_type text NOT NULL,
    details jsonb,
    tx_hash text,
    created_at timestamp DEFAULT now()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_donations_wallet ON donations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_donations_processed ON donations(processed);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_burns_created ON burns(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE burns ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES
-- ========================================

-- Public read access for donations (anyone can view)
CREATE POLICY "Public read donations" ON donations
    FOR SELECT USING (true);

-- Service role can do everything (for Netlify Functions)
CREATE POLICY "Service role full access donations" ON donations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access donors" ON donors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access transfers" ON transfers
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access burns" ON burns
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access trades" ON trades
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access email_logs" ON email_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access admin_actions" ON admin_actions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- DONE! 
-- ========================================
-- Now go to Netlify and add your environment variables:
-- SUPABASE_URL = https://xxxxx.supabase.co
-- SUPABASE_SERVICE_KEY = your_service_role_key
-- SUPABASE_ANON_KEY = your_anon_key (for frontend)
