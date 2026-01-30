const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in farmers table:', Object.keys(data[0]));
    } else {
        console.log('No data found in farmers table.');
    }
}

checkSchema();
