-- Grant SELECT on push_tokens to service_role.
-- Migration 019 created the table without this grant; the admin client
-- in sendMessagePush silently reads 0 rows for push recipients without it.
GRANT SELECT ON public.push_tokens TO service_role;
