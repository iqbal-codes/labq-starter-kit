-- Drop inventory tables (no longer used after single-app refactor)
-- The stock_location_type, stock_movement_type, and unit enums remain in the database
-- as PostgreSQL does not support DROP TYPE IF EXISTS; they are harmless.

DROP TABLE IF EXISTS stock_balances CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_locations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
