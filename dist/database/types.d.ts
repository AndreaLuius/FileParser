import type { Generated, Insertable, Selectable } from "kysely";
export interface Database {
    "paesaggistica.istanza": Istanza;
    "paesaggistica.richiedente": RichiedenteTable;
}
export interface Istanza {
    id: Generated<number>;
    richiedente_id: number;
    anno: string;
    posizione: string;
    note: string;
}
export interface RichiedenteTable {
    id: Generated<number>;
    ragionesociale: string | undefined;
    via: string | undefined;
}
export type RichiedenteGet = Selectable<RichiedenteTable>;
export type RichiedentePost = Insertable<RichiedenteTable>;
export type IstanzaGet = Selectable<Istanza>;
export type IstanzaPost = Insertable<Istanza>;
//# sourceMappingURL=types.d.ts.map