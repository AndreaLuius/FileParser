import { db } from "../database/database.js";
export async function createApplicant(applicant) {
    return await db.insertInto("paesaggistica.richiedente")
        .values(applicant)
        .returningAll()
        .executeTakeFirstOrThrow();
}
;
export async function createInstance(instance) {
    return await db.insertInto("paesaggistica.istanza")
        .values(instance)
        .returningAll()
        .executeTakeFirstOrThrow();
}
//# sourceMappingURL=ApplicantRepository.js.map