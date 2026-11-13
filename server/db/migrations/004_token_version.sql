-- Every session token carries the user's token_version. Logging out bumps it,
-- so every token issued before (on any device) stops working at once.
ALTER TABLE users ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0;
