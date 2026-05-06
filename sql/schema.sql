-- ============================================
-- 缃戠粶楠岃瘉绯荤粺 - 鏁版嵁搴?Schema
-- 鍦?Supabase SQL Editor 涓墽琛?
-- ============================================

-- 1. 杞欢琛?
CREATE TABLE IF NOT EXISTS softwares (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    softid       VARCHAR(32)  NOT NULL UNIQUE,
    status       SMALLINT     NOT NULL DEFAULT 1,
    version_min  VARCHAR(20)  DEFAULT '',
    machine_bind SMALLINT     NOT NULL DEFAULT 1,
    max_online   INT          DEFAULT 0,
    note         VARCHAR(500) DEFAULT '',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. 鍗″瘑琛?
CREATE TABLE IF NOT EXISTS cards (
    id          SERIAL PRIMARY KEY,
    softid      VARCHAR(32)  NOT NULL REFERENCES softwares(softid) ON DELETE CASCADE,
    card_no     VARCHAR(64)  NOT NULL UNIQUE,
    card_type   SMALLINT     NOT NULL DEFAULT 1,
    expire_time TIMESTAMPTZ  NOT NULL,
    status      SMALLINT     NOT NULL DEFAULT 0,
    bind_mac    VARCHAR(64)  DEFAULT '',
    max_bind    SMALLINT     NOT NULL DEFAULT 1,
    bind_count  INT          NOT NULL DEFAULT 0,
    used_at     TIMESTAMPTZ  DEFAULT NULL,
    note        VARCHAR(500) DEFAULT '',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_softid ON cards(softid);
CREATE INDEX idx_cards_status ON cards(status);

-- 3. 楠岃瘉鏃ュ織琛?
CREATE TABLE IF NOT EXISTS auth_logs (
    id         BIGSERIAL PRIMARY KEY,
    softid     VARCHAR(32)  NOT NULL,
    card_id    INT          DEFAULT NULL,
    card_no    VARCHAR(64)  NOT NULL,
    mac        VARCHAR(64)  NOT NULL,
    version    VARCHAR(20)  NOT NULL,
    ip         VARCHAR(45)  NOT NULL,
    result     VARCHAR(20)  NOT NULL,
    token      VARCHAR(32)  DEFAULT '',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_logs_softid ON auth_logs(softid);
CREATE INDEX idx_auth_logs_result ON auth_logs(result);
CREATE INDEX idx_auth_logs_created ON auth_logs(created_at);

-- 4. 绠＄悊鍛樿〃
CREATE TABLE IF NOT EXISTS admin_users (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       SMALLINT     NOT NULL DEFAULT 1,
    status     SMALLINT     NOT NULL DEFAULT 1,
    last_login TIMESTAMPTZ  DEFAULT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 5. 鍦ㄧ嚎浼氳瘽琛?
CREATE TABLE IF NOT EXISTS online_sessions (
    id         BIGSERIAL PRIMARY KEY,
    card_id    INT          NOT NULL,
    token      VARCHAR(32)  NOT NULL UNIQUE,
    mac        VARCHAR(64)  NOT NULL,
    ip         VARCHAR(45)  NOT NULL,
    last_heart TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expire_at  TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_online_sessions_card ON online_sessions(card_id);

-- 6. 鑷姩鏇存柊 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_softwares_updated_at
    BEFORE UPDATE ON softwares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. 鎻掑叆榛樿绠＄悊鍛橈紙瀵嗙爜: admin123锛屽悗缁湪鍚庡彴淇敼锛?
-- 娉ㄦ剰锛歋upabase 鐨?pgcrypto 鎵╁睍闇€瑕佸厛鍚敤
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO admin_users (username, password, role)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 1)
ON CONFLICT (username) DO NOTHING;

-- 8. 浼氳瘽娓呯悊鍑芥暟
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM online_sessions WHERE expire_at < NOW();
END;
$$ LANGUAGE plpgsql;
