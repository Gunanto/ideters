import { Pool } from "pg";
import { env } from "@/lib/config/env";

declare global {
  // eslint-disable-next-line no-var
  var __idetersPool: Pool | undefined;
}

export const pool =
  global.__idetersPool ??
  new Pool({
    connectionString: env.DATABASE_URL
  });

if (process.env.NODE_ENV !== "production") {
  global.__idetersPool = pool;
}
