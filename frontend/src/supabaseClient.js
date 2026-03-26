import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bbkevlbtkmpwvpdzrmbz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2V2bGJ0a21wd3ZwZHpybWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTc4MTMsImV4cCI6MjA5MDA3MzgxM30.ThjUKtMx7uwVq8EteqhuMOb23WijI1SjC8HNMgRtZp8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);