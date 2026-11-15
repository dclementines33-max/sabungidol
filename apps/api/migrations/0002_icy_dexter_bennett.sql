CREATE TABLE "sync_file" (
	"user_id" text NOT NULL,
	"hash" text NOT NULL,
	"size" integer NOT NULL,
	CONSTRAINT "sync_file_user_id_hash_pk" PRIMARY KEY("user_id","hash")
);
--> statement-breakpoint
CREATE TABLE "sync_record" (
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" text NOT NULL,
	"seq" bigserial NOT NULL,
	CONSTRAINT "sync_record_user_id_kind_key_pk" PRIMARY KEY("user_id","kind","key")
);
--> statement-breakpoint
ALTER TABLE "sync_file" ADD CONSTRAINT "sync_file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_record" ADD CONSTRAINT "sync_record_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_record_user_id_seq_index" ON "sync_record" USING btree ("user_id","seq");--> statement-breakpoint
-- Row Level Security as in 0001_rls: on, no policies; only the API Worker (table owner) reads and writes.
ALTER TABLE "sync_record" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sync_file" ENABLE ROW LEVEL SECURITY;
