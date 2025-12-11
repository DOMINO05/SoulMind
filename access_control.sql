-- Re-create the table to support both IP and Device ID tracking
DROP TABLE IF EXISTS public.access_control;
CREATE TABLE public.access_control (
    target TEXT PRIMARY KEY, -- Can be an IP address or a Device ID
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
    BEGIN
        headers := current_setting('request.headers', true)::jsonb;
    EXCEPTION WHEN OTHERS THEN
        headers := '{}'::jsonb;
    END;
    
    ip := COALESCE(
        headers->>'cf-connecting-ip',
        (regexp_split_to_array(headers->>'x-forwarded-for', ','))[1]
    );
    
    RETURN ip;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check access for a specific device and the current IP
CREATE OR REPLACE FUNCTION public.check_access(device_id TEXT)
RETURNS JSON AS $$
DECLARE
    request_ip TEXT;
    ip_record RECORD;
    device_record RECORD;
    result JSON;
BEGIN
    request_ip := public.get_client_ip();

    -- Check IP Lockout (Global Block)
    IF request_ip IS NOT NULL THEN
        SELECT * INTO ip_record FROM public.access_control WHERE target = request_ip;
        
        IF ip_record.lockout_until IS NOT NULL AND ip_record.lockout_until > NOW() THEN
            RETURN json_build_object(
                'allowed', false, 
                'error', 'Túl sok próbálkozás a hálózatodról. Kérlek várj.',
                'lockout_until', ip_record.lockout_until,
                'block_type', 'ip'
            );
        END IF;
    END IF;

    -- Check Device Lockout (Local Block)
    IF device_id IS NOT NULL THEN
        SELECT * INTO device_record FROM public.access_control WHERE target = device_id;
        
        IF device_record.lockout_until IS NOT NULL AND device_record.lockout_until > NOW() THEN
            RETURN json_build_object(
                'allowed', false, 
                'error', 'Túl sok próbálkozás erről az eszközről. Kérlek várj.',
                'lockout_until', device_record.lockout_until,
                'block_type', 'device'
            );
        END IF;
    END IF;
    
    -- If we get here, access is allowed
    -- Check if we need to auto-reset expired locks
    IF ip_record.lockout_until IS NOT NULL AND ip_record.lockout_until <= NOW() THEN
         UPDATE public.access_control SET failed_attempts = 0, lockout_until = NULL WHERE target = request_ip;
    END IF;
    IF device_record.lockout_until IS NOT NULL AND device_record.lockout_until <= NOW() THEN
         UPDATE public.access_control SET failed_attempts = 0, lockout_until = NULL WHERE target = device_id;
    END IF;

    RETURN json_build_object('allowed', true, 'ip', request_ip);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log failure for both Device and IP
CREATE OR REPLACE FUNCTION public.log_failure(device_id TEXT)
RETURNS VOID AS $$
DECLARE
    request_ip TEXT;
    
    -- Limits
    LIMIT_DEVICE INTEGER := 3;
    LIMIT_IP INTEGER := 10;
BEGIN
    request_ip := public.get_client_ip();

    -- 1. Log Device Failure
    IF device_id IS NOT NULL THEN
        INSERT INTO public.access_control (target, failed_attempts) VALUES (device_id, 1)
        ON CONFLICT (target) DO UPDATE 
        SET failed_attempts = access_control.failed_attempts + 1;
        
        -- Apply Device Lock if needed
        UPDATE public.access_control 
        SET lockout_until = NOW() + INTERVAL '15 minutes'
        WHERE target = device_id AND failed_attempts >= LIMIT_DEVICE AND lockout_until IS NULL;
    END IF;

    -- 2. Log IP Failure
    IF request_ip IS NOT NULL THEN
        INSERT INTO public.access_control (target, failed_attempts) VALUES (request_ip, 1)
        ON CONFLICT (target) DO UPDATE 
        SET failed_attempts = access_control.failed_attempts + 1;

        -- Apply IP Lock if needed
        UPDATE public.access_control 
        SET lockout_until = NOW() + INTERVAL '30 minutes'
        WHERE target = request_ip AND failed_attempts >= LIMIT_IP AND lockout_until IS NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset access
CREATE OR REPLACE FUNCTION public.reset_access(device_id TEXT)
RETURNS VOID AS $$
DECLARE
    request_ip TEXT;
BEGIN
    request_ip := public.get_client_ip();
    
    -- Reset Device Record
    IF device_id IS NOT NULL THEN
        DELETE FROM public.access_control WHERE target = device_id;
    END IF;

    -- Reset IP Record
    IF request_ip IS NOT NULL THEN
        DELETE FROM public.access_control WHERE target = request_ip;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
