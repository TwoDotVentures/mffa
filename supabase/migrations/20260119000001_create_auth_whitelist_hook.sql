-- Create a function to validate user signups against the whitelist
-- This function is called by Supabase Auth Hooks (configured in dashboard)

CREATE OR REPLACE FUNCTION public.check_whitelist_on_signup(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    is_whitelisted BOOLEAN;
BEGIN
    -- Extract email from the auth event
    user_email := lower(event->'user'->>'email');

    -- Check if email is in whitelist
    SELECT EXISTS (
        SELECT 1 FROM public.whitelisted_users
        WHERE lower(email) = user_email
    ) INTO is_whitelisted;

    -- If not whitelisted, return an error decision
    IF NOT is_whitelisted THEN
        RETURN jsonb_build_object(
            'decision', 'reject',
            'message', 'Your email is not authorized to access this application.'
        );
    END IF;

    -- Allow the signup to proceed
    RETURN jsonb_build_object(
        'decision', 'continue'
    );
END;
$$;

-- Grant execute permission to the auth service
GRANT EXECUTE ON FUNCTION public.check_whitelist_on_signup(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.check_whitelist_on_signup(jsonb) TO service_role;

-- Add a comment explaining the function's purpose
COMMENT ON FUNCTION public.check_whitelist_on_signup IS
'Auth hook function that validates new signups against the whitelisted_users table.
Configure this in Supabase Dashboard → Authentication → Hooks → Custom Access Token or Send SMS/Email Hook';
