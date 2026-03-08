import { pool } from "@/lib/db/pool";

export async function listLearningSyntaxes() {
  const result = await pool.query(
    `select id, name, slug, description, schema_json, is_active
     from learning_syntaxes
     where is_active = true
     order by name asc`,
  );
  return result.rows;
}

export async function createLearningSyntax(input: {
  name: string;
  slug: string;
  description?: string;
  schemaJson?: unknown;
}) {
  const name = String(input.name || "").trim();
  const slug = String(input.slug || "").trim();
  if (!name || !slug) {
    throw new Error("Name dan slug wajib diisi.");
  }

  const result = await pool.query(
    `insert into learning_syntaxes (name, slug, description, schema_json, is_active)
     values ($1, $2, $3, $4::jsonb, true)
     returning id, name, slug, description, schema_json, is_active`,
    [
      name,
      slug,
      input.description ? String(input.description) : null,
      JSON.stringify(input.schemaJson ?? {}),
    ],
  );

  return result.rows[0];
}

export async function updateLearningSyntax(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string;
    schemaJson?: unknown;
    isActive?: boolean;
  },
) {
  const result = await pool.query(
    `update learning_syntaxes
     set
       name = coalesce($2, name),
       slug = coalesce($3, slug),
       description = coalesce($4, description),
       schema_json = coalesce($5::jsonb, schema_json),
       is_active = coalesce($6, is_active)
     where id = $1
     returning id, name, slug, description, schema_json, is_active`,
    [
      id,
      input.name ?? null,
      input.slug ?? null,
      input.description ?? null,
      input.schemaJson === undefined ? null : JSON.stringify(input.schemaJson),
      input.isActive ?? null,
    ],
  );

  if (!result.rowCount) throw new Error("Learning syntax tidak ditemukan.");
  return result.rows[0];
}

export async function deleteLearningSyntax(id: string) {
  const result = await pool.query(
    `delete from learning_syntaxes where id = $1 returning id`,
    [id],
  );
  if (!result.rowCount) throw new Error("Learning syntax tidak ditemukan.");
}
