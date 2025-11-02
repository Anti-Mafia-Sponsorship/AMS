const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        // Get query parameters
        const params = event.queryStringParameters || {};
        const processed = params.processed === 'true';
        const limit = parseInt(params.limit) || 100;
        
        // Fetch donations
        let query = supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (params.processed !== undefined) {
            query = query.eq('processed', processed);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, donations: data })
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
