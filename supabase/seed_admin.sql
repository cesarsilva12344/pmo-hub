-- SCRIPT: Create Specific User (Force Recreation)
-- Execute este script no SQL Editor do Supabase.

DO $$
DECLARE
    target_email text := 'cesarads96@gmail.com';
    target_pass text := 'Brisa@2026';
    user_id uuid;
BEGIN
    -- 1. CLEANUP (Force delete to ensure password is correct on recreation)
    -- This removes from auth.users. Cascading deletion should handle public.users, 
    -- but we delete manually just in case if no cascade is set up on that specific link strictly.
    DELETE FROM public.users WHERE email = target_email;
    DELETE FROM auth.users WHERE email = target_email;

    -- 2. Create in auth.users
    user_id := uuid_generate_v4();
    
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        'authenticated',
        'authenticated',
        target_email,
        crypt(target_pass, gen_salt('bf', 10)), -- Security factor 10
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now()
    );
    
    RAISE NOTICE 'User % created in auth.users with ID: %', target_email, user_id;

    -- 3. Create in public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        hourly_rate,
        avatar_url
    ) VALUES (
        user_id,
        target_email,
        'Cesar Silva',
        'admin',
        500.00,
        'https://ui-avatars.com/api/?name=Cesar+Silva&background=0284c7&color=fff'
    );
    
    RAISE NOTICE 'Public profile created.';
    
END $$;