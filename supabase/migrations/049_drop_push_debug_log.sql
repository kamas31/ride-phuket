-- Drop the temporary push notification debug table.
-- Created in 048 to diagnose APNS token registration without Safari Web Inspector.
-- Push notifications are now fully working; this table is no longer needed.
drop table if exists push_debug_log;
