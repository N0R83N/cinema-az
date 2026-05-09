import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgbuchimmbrjhevxtcgv.supabase.co';
const supabaseKey = 'sb_publishable_AyV_HgJHr2IgpxNKScCEyA_K-bqAzzf';

export const supabase = createClient(supabaseUrl, supabaseKey);
