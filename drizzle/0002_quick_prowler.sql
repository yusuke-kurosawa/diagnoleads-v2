CREATE TABLE "qr_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"diagnostic_template_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"short_code" text NOT NULL,
	"tracking_url" text NOT NULL,
	"utm_source" text DEFAULT 'qrcode' NOT NULL,
	"utm_medium" text DEFAULT 'offline' NOT NULL,
	"utm_campaign" text,
	"utm_content" text,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"completion_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_campaigns_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "qr_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"ip_address_hash" text,
	"user_agent" text,
	"device_type" text,
	"location" jsonb,
	"session_id" uuid,
	"converted" boolean DEFAULT false NOT NULL,
	"lead_id" uuid,
	"scanned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qr_campaigns" ADD CONSTRAINT "qr_campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_campaigns" ADD CONSTRAINT "qr_campaigns_diagnostic_template_id_diagnostic_templates_id_fk" FOREIGN KEY ("diagnostic_template_id") REFERENCES "public"."diagnostic_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_campaign_id_qr_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."qr_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;