import type { RichiedentePost, IstanzaPost } from "../database/types.js";
export declare function createApplicant(applicant: RichiedentePost): Promise<{
    id: number;
    ragionesociale: string | undefined;
    via: string | undefined;
}>;
export declare function createInstance(instance: IstanzaPost): Promise<{
    id: number;
    richiedente_id: number;
    anno: string;
    posizione: string;
    note: string;
}>;
//# sourceMappingURL=ApplicantRepository.d.ts.map