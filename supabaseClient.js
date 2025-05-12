import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wswsuxoaxbrjxuvvsojo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzd3N1eG9heGJyanh1dnZzb2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5Nzg2MTIsImV4cCI6MjA2MjU1NDYxMn0.GmJQCUcBMaDuamfPyaiHl6ZzXviECzocnu5rkJMg1rY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);