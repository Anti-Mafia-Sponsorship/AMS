const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const data = JSON.parse(event.body);
        
        if (!data.walletAddress || !data.bnbAmount) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }
        
        // Save donor
        await supabase.from('donors').upsert({
            wallet_address: data.walletAddress,
            name: data.name || 'Анонимен',
            email: data.email || null,
            phone: data.phone || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'wallet_address' });
        
        // Save donation
        const { data: donation, error } = await supabase
            .from('donations')
            .insert([{
                wallet_address: data.walletAddress,
                donor_name: data.name || 'Анонимен',
                donor_email: data.email || null,
                donor_phone: data.phone || null,
                bnb_amount: parseFloat(data.bnbAmount),
                tokens_to_receive: parseFloat(data.tokensAmount || 0),
                tx_hash: data.txHash || null,
                variant: data.variant || 'A',
                notes: data.notes || null,
                processed: false
            }])
            .select();
        
        if (error) throw new Error('Database error: ' + error.message);
        
        // Send email to owner
        try {
            await sgMail.send({
                to: process.env.OWNER_EMAIL,
                from: process.env.SENDER_EMAIL || 'noreply@yourdomain.com',
                subject: `🎁 Ново AMS Дарение - ${data.name || 'Анонимен'}`,
                html: `<h2>Ново Дарение!</h2><p>Име: ${data.name || 'Анонимен'}</p><p>Email: ${data.email || 'N/A'}</p><p>Wallet: ${data.walletAddress}</p><p>BNB: ${data.bnbAmount}</p>`
            });
        } catch (e) {
            console.error('Email error:', e);
        }
        
        // Send confirmation to donor
        if (data.email && data.email !== 'anonymous@anonymous.com') {
            try {
                await sgMail.send({
                    to: data.email,
                    from: process.env.SENDER_EMAIL || 'noreply@yourdomain.com',
                    subject: '✅ Твоето AMS Дарение е Получено!',
                    html: `<h2>Благодарим!</h2><p>Получихме ${data.bnbAmount} BNB. Скоро ще получиш токените!</p>`
                });
            } catch (e) {
                console.error('Donor email error:', e);
            }
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, donation: donation[0] })
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
