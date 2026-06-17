```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Devices Table
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    ip_address VARCHAR(15),
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, blocked, quarantined
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE
);

-- Alerts Table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    threat_id INTEGER REFERENCES threats(id),
    description TEXT NOT NULL,
    severity VARCHAR(50), -- low, medium, high, critical
    status VARCHAR(50) DEFAULT 'new', -- new, in_progress, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Incidents Table
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open', -- open, under_investigation, closed
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Threats Table
CREATE TABLE threats (
    id SERIAL PRIMARY KEY,
    threat_type VARCHAR(100) NOT NULL, -- DDoS, ARP Spoofing, etc.
    source_ip VARCHAR(15),
    destination_ip VARCHAR(15),
    details JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs (Blockchain references)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    device_id INTEGER REFERENCES devices(id),
    details TEXT,
    transaction_hash VARCHAR(66) UNIQUE,
    block_number INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Network Traffic Data
CREATE TABLE network_traffic (
    id SERIAL PRIMARY KEY,
    source_ip VARCHAR(15),
    destination_ip VARCHAR(15),
    protocol VARCHAR(10),
    port INTEGER,
    packet_size INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table (Role-based access control)
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE(role, resource)
);

-- IOC (Indicator of Compromise) Feeds
CREATE TABLE ioc_feeds (
    id SERIAL PRIMARY KEY,
    feed_name VARCHAR(100),
    ioc_type VARCHAR(50), -- ip, domain, hash
    value VARCHAR(255) UNIQUE NOT NULL,
    source_url TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

```