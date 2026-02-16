import type { Database } from "./types.js";
import {Pool} from "pg";
import {Kysely, PostgresDialect} from "kysely";

const dialect = new PostgresDialect({
    pool: new Pool({
        database: "cartelle",
        host: "localhost",
        user: "postgres",
        password: "secret",
        port: 5432,
        max: 10
    })
});

export const db = new Kysely<Database>({
    dialect
});