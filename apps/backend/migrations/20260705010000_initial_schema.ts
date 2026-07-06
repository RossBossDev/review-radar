import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable("github_installations")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("github_installation_id", "text", (col) =>
			col.notNull().unique(),
		)
		.addColumn("account_login", "text")
		.addColumn("account_type", "text")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.execute();

	await db.schema
		.createTable("github_repositories")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("github_repository_id", "text", (col) => col.notNull().unique())
		.addColumn("installation_id", "uuid", (col) =>
			col.references("github_installations.id").onDelete("cascade").notNull(),
		)
		.addColumn("owner", "text", (col) => col.notNull())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("full_name", "text", (col) => col.notNull().unique())
		.addColumn("default_branch", "text")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.execute();

	await db.schema
		.createTable("github_users")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("github_user_id", "text", (col) => col.notNull().unique())
		.addColumn("login", "text", (col) => col.notNull().unique())
		.addColumn("name", "text")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.execute();

	await db.schema
		.createTable("slack_workspaces")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("slack_team_id", "text", (col) => col.notNull().unique())
		.addColumn("name", "text")
		.addColumn("bot_user_id", "text")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.execute();

	await db.schema
		.createTable("slack_users")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("workspace_id", "uuid", (col) =>
			col.references("slack_workspaces.id").onDelete("cascade").notNull(),
		)
		.addColumn("slack_user_id", "text", (col) => col.notNull())
		.addColumn("name", "text")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addUniqueConstraint("slack_users_workspace_user_unique", [
			"workspace_id",
			"slack_user_id",
		])
		.execute();

	await db.schema
		.createTable("workspace_links")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("installation_id", "uuid", (col) =>
			col.references("github_installations.id").onDelete("cascade").notNull(),
		)
		.addColumn("workspace_id", "uuid", (col) =>
			col.references("slack_workspaces.id").onDelete("cascade").notNull(),
		)
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addUniqueConstraint("workspace_links_installation_workspace_unique", [
			"installation_id",
			"workspace_id",
		])
		.execute();

	await db.schema
		.createTable("pull_requests")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("repository_id", "uuid", (col) =>
			col.references("github_repositories.id").onDelete("cascade").notNull(),
		)
		.addColumn("github_pull_request_id", "text", (col) => col.notNull())
		.addColumn("number", "integer", (col) => col.notNull())
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("author_github_user_id", "uuid", (col) =>
			col.references("github_users.id").onDelete("set null"),
		)
		.addColumn("state", "text", (col) => col.notNull())
		.addColumn("html_url", "text", (col) => col.notNull())
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("merged_at", "timestamptz")
		.addColumn("closed_at", "timestamptz")
		.addUniqueConstraint("pull_requests_repository_number_unique", [
			"repository_id",
			"number",
		])
		.addUniqueConstraint("pull_requests_repository_github_id_unique", [
			"repository_id",
			"github_pull_request_id",
		])
		.execute();

	await db.schema
		.createTable("pull_request_participants")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("pull_request_id", "uuid", (col) =>
			col.references("pull_requests.id").onDelete("cascade").notNull(),
		)
		.addColumn("github_user_id", "uuid", (col) =>
			col.references("github_users.id").onDelete("cascade").notNull(),
		)
		.addColumn("role", "text", (col) => col.notNull())
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addUniqueConstraint("pull_request_participants_pr_user_role_unique", [
			"pull_request_id",
			"github_user_id",
			"role",
		])
		.execute();

	await db.schema
		.createTable("github_events")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("github_delivery_id", "text", (col) => col.notNull().unique())
		.addColumn("event_name", "text", (col) => col.notNull())
		.addColumn("installation_id", "uuid", (col) =>
			col.references("github_installations.id").onDelete("set null"),
		)
		.addColumn("repository_id", "uuid", (col) =>
			col.references("github_repositories.id").onDelete("set null"),
		)
		.addColumn("payload", "jsonb", (col) => col.notNull())
		.addColumn("received_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("processed_at", "timestamptz")
		.execute();

	await db.schema
		.createTable("attention_items")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("pull_request_id", "uuid", (col) =>
			col.references("pull_requests.id").onDelete("cascade").notNull(),
		)
		.addColumn("attention_type", "text", (col) => col.notNull())
		.addColumn("assignee_github_user_id", "uuid", (col) =>
			col.references("github_users.id").onDelete("set null"),
		)
		.addColumn("reason", "text", (col) => col.notNull())
		.addColumn("status", "text", (col) => col.notNull())
		.addColumn("detected_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("resolved_at", "timestamptz")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.execute();

	await db.schema
		.createTable("deliveries")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(db.fn("gen_random_uuid")),
		)
		.addColumn("attention_item_id", "uuid", (col) =>
			col.references("attention_items.id").onDelete("set null"),
		)
		.addColumn("workspace_id", "uuid", (col) =>
			col.references("slack_workspaces.id").onDelete("set null"),
		)
		.addColumn("slack_user_id", "uuid", (col) =>
			col.references("slack_users.id").onDelete("set null"),
		)
		.addColumn("channel_id", "text")
		.addColumn("dedupe_key", "text", (col) => col.notNull().unique())
		.addColumn("delivery_type", "text", (col) => col.notNull())
		.addColumn("status", "text", (col) => col.notNull())
		.addColumn("error_message", "text")
		.addColumn("delivered_at", "timestamptz")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.execute();

	await db.schema
		.createTable("app_settings")
		.addColumn("key", "text", (col) => col.primaryKey())
		.addColumn("value", "jsonb", (col) => col.notNull())
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(db.fn("now")),
		)
		.execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable("app_settings").execute();
	await db.schema.dropTable("deliveries").execute();
	await db.schema.dropTable("attention_items").execute();
	await db.schema.dropTable("github_events").execute();
	await db.schema.dropTable("pull_request_participants").execute();
	await db.schema.dropTable("pull_requests").execute();
	await db.schema.dropTable("workspace_links").execute();
	await db.schema.dropTable("slack_users").execute();
	await db.schema.dropTable("slack_workspaces").execute();
	await db.schema.dropTable("github_users").execute();
	await db.schema.dropTable("github_repositories").execute();
	await db.schema.dropTable("github_installations").execute();
}
