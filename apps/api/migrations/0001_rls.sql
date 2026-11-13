-- Row Level Security (PRD §11): on for every table, with no policies, so Supabase's public REST API
-- (anon / authenticated keys) sees nothing. Only the API Worker, connecting as the table owner,
-- reads and writes, and every backup query there is filtered on the logged-in user's id.
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cloud_backup" ENABLE ROW LEVEL SECURITY;
