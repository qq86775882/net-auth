-- ============================================
-- 缃戠粶楠岃瘉绯荤粺 - Supabase RPC 鍑芥暟
-- 鍦?Supabase SQL Editor 涓墽琛岋紙schema.sql 涔嬪悗锛?
-- ============================================

-- 楠岃瘉绠＄悊鍛樺瘑鐮?
CREATE OR REPLACE FUNCTION verify_admin_password(
    input_username TEXT,
    input_password TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT password INTO stored_hash
    FROM admin_users
    WHERE username = input_username AND status = 1;

    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 淇敼绠＄悊鍛樺瘑鐮?
CREATE OR REPLACE FUNCTION update_admin_password(
    input_username TEXT,
    input_password TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_users
    SET password = crypt(input_password, gen_salt('bf'))
    WHERE username = input_username;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
