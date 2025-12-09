
const SUPABASE_URL = 'https://pmrmbddwlwhohjbvkxmf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcm1iZGR3bHdob2hqYnZreG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjMzNDgsImV4cCI6MjA3OTgzOTM0OH0.Xk5hTWaiLKnJUfUv0ePFINUp';

// Check if the global supabase object is available (from CDN)
if (!window.supabase) {
    console.error('Supabase SDK not loaded! Check index.html');
}

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Client Initialized');
