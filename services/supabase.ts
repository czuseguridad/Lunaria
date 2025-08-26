import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pfiidibdkyxgerklpivy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaWlkaWJka3l4Z2Vya2xwaXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTc5NjEsImV4cCI6MjA3MTQ5Mzk2MX0.mAwZnH2ZGhWH2b5Mml3HGLPc7qRckw13zNHFCOXcz7c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
