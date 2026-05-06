-- ============================================
-- 网络验证系统 - 数据库 Schema
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 软件表
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

-- 2. 卡密表
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

-- 3. 验证日志表
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

-- 4. 管理员表
CREATE TABLE IF NOT EXISTS admin_users (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       SMALLINT     NOT NULL DEFAULT 1,
    status     SMALLINT     NOT NULL DEFAULT 1,
    last_login TIMESTAMPTZ  DEFAULT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 5. 在线会话表
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

-- 6. 自动更新 updated_at
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

-- 7. 插入默认管理员（密码: admin123，后续在后台修改）
-- 注意：Supabase 的 pgcrypto 扩展需要先启用
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO admin_users (username, password, role)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 1)
ON CONFLICT (username) DO NOTHING;

-- 8. 会话清理函数
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM online_sessions WHERE expire_at < NOW();
END;
$$ LANGUAGE plpgsql;
