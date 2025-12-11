-- Create the table for tracking access attempts
CREATE TABLE IF NOT EXISTS public.access_control (
    ip_address TEXT PRIMARY KEY,
    failed_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMP WITH TIME ZONE
);

-- Helper function to get the client IP address from request headers
CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS TEXT AS $$
DECLARE
    headers jsonb;
    ip text;
BEGIN
    -- Get headers from the current request
    BEGIN
        headers := current_setting('request.headers', true)::jsonb;
    EXCEPTION WHEN OTHERS THEN
        headers := '{}'::jsonb;
    END;
    
    -- Try to get the IP from 'cf-connecting-ip' (Cloudflare) or 'x-forwarded-for'
    ip := COALESCE(
        headers->>'cf-connecting-ip',
        (regexp_split_to_array(headers->>'x-forwarded-for', ','))[1]
    );
    
    RETURN ip;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if the current user (by IP) is allowed to access
CREATE OR REPLACE FUNCTION public.check_access()
RETURNS JSON AS $$
DECLARE
    request_ip TEXT;
    record RECORD;
    result JSON;
BEGIN
    -- Get IP automatically
    request_ip := public.get_client_ip();

    -- Return early if IP is null (shouldn't happen in prod, but maybe in local dev)
    IF request_ip IS NULL THEN
        RETURN json_build_object('allowed', true, 'warning', 'No IP detected');
    END IF;

    SELECT * INTO record FROM public.access_control WHERE ip_address = request_ip;
    
    IF record.lockout_until IS NOT NULL AND record.lockout_until > NOW() THEN
        -- IP is locked out
        result := json_build_object(
            'allowed', false, 
            'error', 'Túl sok sikertelen próbálkozás. Kérlek várj.',
            'lockout_until', record.lockout_until,
            'ip', request_ip
        );
    ELSE
        -- IP is not locked out (or record doesn't exist)
        result := json_build_object('allowed', true, 'ip', request_ip);
        
        -- If lockout time passed, reset the record
        IF record.lockout_until IS NOT NULL AND record.lockout_until <= NOW() THEN
             UPDATE public.access_control 
             SET failed_attempts = 0, lockout_until = NULL 
             WHERE ip_address = request_ip;
        END IF;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log a failed attempt for the current IP
CREATE OR REPLACE FUNCTION public.log_failure()
RETURNS VOID AS $$
DECLARE
    request_ip TEXT;
    record RECORD;
    new_attempts INTEGER;
BEGIN
    request_ip := public.get_client_ip();
    
    IF request_ip IS NULL THEN RETURN; END IF;

    SELECT * INTO record FROM public.access_control WHERE ip_address = request_ip;

    IF record IS NULL THEN
        INSERT INTO public.access_control (ip_address, failed_attempts) VALUES (request_ip, 1);
    ELSE
        new_attempts := record.failed_attempts + 1;
        
        IF new_attempts >= 3 THEN
             -- Lock out for 15 minutes
             UPDATE public.access_control 
             SET failed_attempts = new_attempts, lockout_until = NOW() + INTERVAL '15 minutes'
             WHERE ip_address = request_ip;
        ELSE
             UPDATE public.access_control 
             SET failed_attempts = new_attempts
             WHERE ip_address = request_ip;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset access upon successful login for the current IP
CREATE OR REPLACE FUNCTION public.reset_access()
RETURNS VOID AS $$
DECLARE
    request_ip TEXT;
BEGIN
    request_ip := public.get_client_ip();
    IF request_ip IS NOT NULL THEN
        DELETE FROM public.access_control WHERE ip_address = request_ip;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
