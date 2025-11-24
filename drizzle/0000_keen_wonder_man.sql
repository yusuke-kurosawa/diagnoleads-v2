CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"company" text,
	"phone" text,
	"status" text DEFAULT 'new' NOT NULL,
	"score" integer,
	"source" text,
	"responses" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"email_verified" boolean DEFAULT false,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================
-- マルチテナント分離のためのセキュリティポリシー

-- RLS を有効化
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- 現在のユーザーIDを取得するヘルパー関数
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE SQL STABLE;

-- ユーザーが所属する組織IDのリストを取得
CREATE OR REPLACE FUNCTION auth.user_organization_ids() RETURNS SETOF uuid AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ユーザーが組織のメンバーかチェック
CREATE OR REPLACE FUNCTION auth.is_organization_member(org_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.user_id()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ユーザーの組織内ロールを取得
CREATE OR REPLACE FUNCTION auth.user_role_in_organization(org_id uuid) RETURNS text AS $$
  SELECT role
  FROM organization_members
  WHERE organization_id = org_id
    AND user_id = auth.user_id()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- Users Table Policies
-- ============================================================================

-- ユーザーは自分の情報を閲覧可能
CREATE POLICY "users_select_own" ON "users"
  FOR SELECT
  USING (id = auth.user_id());

-- ユーザーは同じ組織のメンバーの情報を閲覧可能
CREATE POLICY "users_select_same_org" ON "users"
  FOR SELECT
  USING (
    id IN (
      SELECT user_id
      FROM organization_members
      WHERE organization_id IN (SELECT auth.user_organization_ids())
    )
  );

-- ユーザーは自分の情報を更新可能
CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- ユーザーは自分の情報を削除可能（アカウント削除）
CREATE POLICY "users_delete_own" ON "users"
  FOR DELETE
  USING (id = auth.user_id());

-- ============================================================================
-- Organizations Table Policies
-- ============================================================================

-- ユーザーは自分が所属する組織を閲覧可能
CREATE POLICY "organizations_select" ON "organizations"
  FOR SELECT
  USING (id IN (SELECT auth.user_organization_ids()));

-- オーナーと管理者のみが組織情報を更新可能
CREATE POLICY "organizations_update" ON "organizations"
  FOR UPDATE
  USING (
    auth.user_role_in_organization(id) IN ('owner', 'admin')
  )
  WITH CHECK (
    auth.user_role_in_organization(id) IN ('owner', 'admin')
  );

-- オーナーのみが組織を削除可能
CREATE POLICY "organizations_delete" ON "organizations"
  FOR DELETE
  USING (auth.user_role_in_organization(id) = 'owner');

-- 新規組織の作成は誰でも可能（新規登録時）
CREATE POLICY "organizations_insert" ON "organizations"
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Organization Members Table Policies
-- ============================================================================

-- ユーザーは自分が所属する組織のメンバー一覧を閲覧可能
CREATE POLICY "organization_members_select" ON "organization_members"
  FOR SELECT
  USING (organization_id IN (SELECT auth.user_organization_ids()));

-- オーナーと管理者のみがメンバーを追加可能
CREATE POLICY "organization_members_insert" ON "organization_members"
  FOR INSERT
  WITH CHECK (
    auth.user_role_in_organization(organization_id) IN ('owner', 'admin')
  );

-- オーナーと管理者のみがメンバーのロールを更新可能
CREATE POLICY "organization_members_update" ON "organization_members"
  FOR UPDATE
  USING (
    auth.user_role_in_organization(organization_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    auth.user_role_in_organization(organization_id) IN ('owner', 'admin')
  );

-- オーナーと管理者のみがメンバーを削除可能（ただし自分自身は除く）
CREATE POLICY "organization_members_delete" ON "organization_members"
  FOR DELETE
  USING (
    auth.user_role_in_organization(organization_id) IN ('owner', 'admin')
    AND user_id != auth.user_id()
  );

-- ユーザーは自分自身を組織から退出可能
CREATE POLICY "organization_members_leave" ON "organization_members"
  FOR DELETE
  USING (user_id = auth.user_id());

-- ============================================================================
-- Leads Table Policies
-- ============================================================================

-- ユーザーは自分の組織のリードを閲覧可能
CREATE POLICY "leads_select" ON "leads"
  FOR SELECT
  USING (organization_id IN (SELECT auth.user_organization_ids()));

-- ユーザーは自分の組織にリードを追加可能
CREATE POLICY "leads_insert" ON "leads"
  FOR INSERT
  WITH CHECK (organization_id IN (SELECT auth.user_organization_ids()));

-- ユーザーは自分の組織のリードを更新可能
CREATE POLICY "leads_update" ON "leads"
  FOR UPDATE
  USING (organization_id IN (SELECT auth.user_organization_ids()))
  WITH CHECK (organization_id IN (SELECT auth.user_organization_ids()));

-- オーナーと管理者のみがリードを削除可能
CREATE POLICY "leads_delete" ON "leads"
  FOR DELETE
  USING (
    auth.user_role_in_organization(organization_id) IN ('owner', 'admin')
  );

-- ============================================================================
-- Sessions Table Policies
-- ============================================================================

-- ユーザーは自分のセッションのみ閲覧可能
CREATE POLICY "sessions_select" ON "sessions"
  FOR SELECT
  USING (user_id = auth.user_id());

-- セッション作成は誰でも可能（ログイン時）
CREATE POLICY "sessions_insert" ON "sessions"
  FOR INSERT
  WITH CHECK (true);

-- ユーザーは自分のセッションのみ更新可能
CREATE POLICY "sessions_update" ON "sessions"
  FOR UPDATE
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

-- ユーザーは自分のセッションのみ削除可能（ログアウト時）
CREATE POLICY "sessions_delete" ON "sessions"
  FOR DELETE
  USING (user_id = auth.user_id());

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- RLS ポリシーのパフォーマンス向上のためのインデックス
CREATE INDEX IF NOT EXISTS "organization_members_user_id_idx" ON "organization_members"("user_id");
CREATE INDEX IF NOT EXISTS "organization_members_organization_id_idx" ON "organization_members"("organization_id");
CREATE INDEX IF NOT EXISTS "leads_organization_id_idx" ON "leads"("organization_id");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions"("token");