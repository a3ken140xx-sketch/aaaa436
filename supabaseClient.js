const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase connected');
} else {
  console.warn('SUPABASE_URL and SUPABASE_KEY not set — using in-memory fallback');
}

module.exports = supabase;
