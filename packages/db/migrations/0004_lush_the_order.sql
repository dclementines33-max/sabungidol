ALTER TABLE "competitions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "sync_key" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "idols" ADD COLUMN "sync_key" text;--> statement-breakpoint
ALTER TABLE "idols" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "hash" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;