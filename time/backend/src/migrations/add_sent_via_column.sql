-- Add sent_via column to notifications table
ALTER TABLE notifications ADD COLUMN sent_via TEXT DEFAULT 'push';
