import { db } from "../database/database.js";

import type { RichiedenteGet, RichiedentePost, IstanzaPost } from "../database/types.js";

export async function createApplicant(applicant: RichiedentePost) {
    return await db.insertInto("paesaggistica.richiedente")
        .values(applicant)
        .returningAll()
        .executeTakeFirstOrThrow()
};


export async function createInstance(instance: IstanzaPost) {
    return await db.insertInto("paesaggistica.istanza")
        .values(instance)
        .returningAll()
        .executeTakeFirstOrThrow();
}