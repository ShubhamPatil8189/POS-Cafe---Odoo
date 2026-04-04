-- This SQL script helps re-sync the tables table to ensure IDs 1 and 2 exist if they were lost.
-- USE POS_cafe; -- Only if needed

-- 1. Backup current tables if needed
-- CREATE TABLE tables_backup AS SELECT * FROM tables;

-- 2. If IDs are missing, you can insert them manually or reset the table.
-- WARNING: This will delete existing table assignments if not handled carefully.

/*
INSERT INTO tables (id, floor_id, table_number, seats, status) 
VALUES (2, 1, 'T2', 2, 'available')
ON DUPLICATE KEY UPDATE table_number = 'T2';
*/

-- 3. Check current IDs
SELECT id, table_number, status FROM tables;

-- 4. If you need to reset auto-increment to start from a specific number:
-- ALTER TABLE tables AUTO_INCREMENT = 1;

-- 5. Ensure the foreign key exists in orders
-- SHOW CREATE TABLE orders;
