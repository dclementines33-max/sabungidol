CREATE TABLE "achievements" (
	"idol_id" text NOT NULL,
	"badge" text NOT NULL,
	"season_id" text NOT NULL,
	"evidence_match_id" text,
	CONSTRAINT "achievements_idol_id_badge_season_id_pk" PRIMARY KEY("idol_id","badge","season_id")
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"season_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"branding" jsonb,
	CONSTRAINT "competitions_season_id_code_pk" PRIMARY KEY("season_id","code")
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"season_id" text NOT NULL,
	"comp" text NOT NULL,
	"stage" text NOT NULL,
	"idol_id" text NOT NULL,
	"slot" integer,
	"seed_rank" integer,
	"source" text,
	CONSTRAINT "entries_season_id_comp_stage_idol_id_pk" PRIMARY KEY("season_id","comp","stage","idol_id")
);
--> statement-breakpoint
CREATE TABLE "event_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"level" text NOT NULL,
	"code" text,
	"message" text NOT NULL,
	"context" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo_id" text
);
--> statement-breakpoint
CREATE TABLE "idols" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"group_id" text,
	"seed" smallint,
	"nationality" text,
	"birthday" date,
	"photo_id" text,
	"rating" smallint NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"comp" text NOT NULL,
	"stage" text NOT NULL,
	"round" text NOT NULL,
	"idol_a" text NOT NULL,
	"idol_b" text NOT NULL,
	"games" smallint NOT NULL,
	"score_a" smallint NOT NULL,
	"score_b" smallint NOT NULL,
	"result" text NOT NULL,
	"method" text NOT NULL,
	"rating_a" smallint NOT NULL,
	"rating_b" smallint NOT NULL,
	"form_a" text NOT NULL,
	"form_b" text NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"focal_x" real,
	"focal_y" real,
	"sizes" jsonb,
	"bytes" integer
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"season_id" text NOT NULL,
	"comp" text NOT NULL,
	"idol_id" text NOT NULL,
	"final_rank" integer NOT NULL,
	"stage_reached" text,
	CONSTRAINT "placements_season_id_comp_idol_id_pk" PRIMARY KEY("season_id","comp","idol_id")
);
--> statement-breakpoint
CREATE TABLE "rating_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rating_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"idol_id" text NOT NULL,
	"season_id" text,
	"old" smallint NOT NULL,
	"new" smallint NOT NULL,
	"source" text NOT NULL,
	"reason" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"name" text NOT NULL,
	"seed" text NOT NULL,
	"status" text NOT NULL,
	"config" jsonb,
	CONSTRAINT "seasons_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "stats_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"payload" jsonb NOT NULL,
	"built_from_rev" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_idol_id_idols_id_fk" FOREIGN KEY ("idol_id") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_evidence_match_id_matches_id_fk" FOREIGN KEY ("evidence_match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_idol_id_idols_id_fk" FOREIGN KEY ("idol_id") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idols" ADD CONSTRAINT "idols_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_idol_a_idols_id_fk" FOREIGN KEY ("idol_a") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_idol_b_idols_id_fk" FOREIGN KEY ("idol_b") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_idol_id_idols_id_fk" FOREIGN KEY ("idol_id") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_idol_id_idols_id_fk" FOREIGN KEY ("idol_id") REFERENCES "public"."idols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idols_name_group" ON "idols" USING btree (lower("name"),coalesce("group_id", ''));--> statement-breakpoint
CREATE INDEX "matches_season_comp_stage" ON "matches" USING btree ("season_id","comp","stage");--> statement-breakpoint
CREATE INDEX "matches_idol_a" ON "matches" USING btree ("idol_a");--> statement-breakpoint
CREATE INDEX "matches_idol_b" ON "matches" USING btree ("idol_b");--> statement-breakpoint
CREATE INDEX "placements_idol" ON "placements" USING btree ("idol_id");