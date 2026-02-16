import { join, dirname } from "node:path";
import xlsx from "node-xlsx";
import fs from "node:fs";
import "dotenv/config";
import { getEnvPath } from "./env.js";
import { createApplicant, createInstance } from "./respository/ApplicantRepository.js";
import { readFile } from "fs/promises";
import inquirer from "inquirer";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const applicantKeys = ["nome", "cognome", "indirizzo", "cognome e nome", "numero", "anno"];
const parseXml2 = async (fileName) => {
    const workSheetFromFile = xlsx.parse(fs.readFileSync(fileName));
    for (let file of workSheetFromFile) {
        const header = file.data[0];
        const data = file.data;
        if (!header)
            throw new Error("Header is missing");
        for (let row of data) {
            if (!row || row.length === 0)
                continue;
            const applicant = {};
            const name = row[header.indexOf("NOME")];
            applicant.ragsociale = name ? `${name} ${name} ${row[header.indexOf("COGNOME")] ?? ""}` : "Sconosciuto";
            applicant.indirizzo = row[header.indexOf("INDIRIZZO")] ?? "";
            // TODO:  create the applicant in the database
            const idx = 1; //"INDEX OF THE APPLICANT IN THE DATABASE"; // AFTER CREATION
            const instance = {
                richiedente_id: idx,
                anno: row[header.indexOf("ANNO")] ?? "",
                posizione: row[header.indexOf("NUMERO")] ?? "",
                note: name ? "" : "Il richiedente dell'istanza è sconosciuto"
            };
            //TODO: create the instance in the database
            console.log("Applicant created", applicant);
            console.log("Instance created", instance);
        }
    }
};
const columnStart = (lines, headerIndex, keys) => {
    const map = new Map();
    for (let key of keys)
        map.set(key, lines[headerIndex]?.indexOf(key) ?? -1);
    return map;
};
const parseTxt2 = async (fileName) => {
    const fileContent = await readFile(fileName, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    const columns = [
        "ANNO",
        "PRAT.",
        "OGGETTO",
        "F.",
        "MAPP.",
        "CONC. ED.",
        "DATA",
        "INTESTATARIO"
    ];
    const headerIndex = lines.findIndex(l => l.includes("INTESTATARIO")
        || l.startsWith("ANNO")
        || l.includes("PRAT."));
    if (headerIndex === -1)
        throw new Error("Header line not found");
    const dashIndex = lines.findIndex((l, idx) => idx > headerIndex && /-{2,}/.test(l));
    const dashLine = lines[dashIndex];
    if (dashIndex === -1)
        throw new Error("Dash separator line not found after header");
    const indexes = Array.from(dashLine?.matchAll(/-+/g)).map(itm => {
        return {
            start: itm.index ?? 0,
            end: (itm.index ?? 0) + itm[0].length
        };
    });
    // type cln3 = [K in typeof columns[number] as Lowercase<K>]
    const applicant = {};
    for (let i = headerIndex + 1; i < lines.length; i++) {
        if (lines[i]?.match(/-+/g) || lines[i]?.includes("Pag."))
            continue;
        for (let j = 0; j < indexes.length; j++) {
            const data = indexes[j];
            const key = columns[j]?.toLocaleLowerCase();
            applicant[key] = lines[i]?.substring(data.start, data.end) ?? "";
        }
        applicant.intestatario = applicant.intestatario ? applicant.intestatario : "Sconosciuto";
        console.log(applicant);
    }
};
const applicantRecordMapper = (header) => {
    const isApplicantType = (value) => {
        return applicantKeys.includes(value);
    };
    const applicantMapper = {};
    header.forEach((value, index) => {
        const val = value.toLocaleLowerCase();
        if (isApplicantType(val)) {
            let key = val;
            applicantMapper[key] = index;
        }
    });
    return applicantMapper;
};
const checkMapper = (prop, key, row) => {
    const index = prop[key];
    if (index === undefined)
        return undefined;
    const cell = row[index];
    if (!cell)
        return undefined;
    return cell.toLocaleString();
};
async function parseXml(fileName) {
    const workSheetFromFile = xlsx.parse(fs.readFileSync(fileName));
    for (let file of workSheetFromFile) {
        const header = file.data[0];
        const data = file.data;
        if (!header)
            throw new Error("Header is missing");
        const applicantMapper = applicantRecordMapper(header.map(String));
        for (let row of data) {
            const applicant = {};
            if (applicantMapper.nome === undefined || applicantMapper.cognome === undefined) {
                const cell = checkMapper(applicantMapper, "cognome e nome", row);
                if (!cell) {
                    applicant.nome = "Sconosciuto";
                    applicant.cognome = "";
                    applicant.indirizzo = row[header.indexOf("INDIRIZZO")] ?? "";
                }
                else {
                    const [cognome, nome] = cell.split(" ");
                    if (!cognome || !nome)
                        continue;
                    applicant.cognome = cognome;
                    applicant.nome = nome;
                }
            }
            else {
                if (row[applicantMapper.nome] === undefined
                    || row[applicantMapper.cognome] === undefined)
                    continue;
                applicant.nome = row[applicantMapper.nome];
                applicant.cognome = row[applicantMapper.cognome];
            }
            const cellAddress = checkMapper(applicantMapper, "indirizzo", row);
            applicant.indirizzo = cellAddress ?? "";
            console.log("cuia");
            // TODO: create a dedicated function for this 
            try {
                const applicant_query = {
                    ragsociale: `${applicant.nome} ${applicant.cognome}`,
                    indirizzo: applicant.indirizzo
                };
                console.log(applicant_query);
                const queryResult = await createApplicant({
                    ragionesociale: applicant_query.ragsociale,
                    via: applicant_query.indirizzo
                });
                const queryInstanceResult = await createInstance({
                    richiedente_id: queryResult.id,
                    anno: row[header.indexOf("ANNO")] ?? "",
                    posizione: row[header.indexOf("NUMERO")] ?? "",
                    note: ""
                });
                console.log(queryResult.id, queryInstanceResult);
            }
            catch (err) {
                throw new Error("something went wrong", { cause: err });
            }
        }
    }
}
function buildBoundsFromDashes(dashLine, colCount) {
    // Find each group of hyphens (----) and use its start as the column start.
    // Then the end of a column is the next group's start; last ends at line.length.
    const groups = Array.from(dashLine.matchAll(/-+/g)).map((m) => ({
        start: m.index ?? 0,
        end: (m.index ?? 0) + m[0].length,
    }));
    if (groups.length < colCount) {
        throw new Error(`Not enough dash groups to infer ${colCount} columns. Found ${groups.length}. Line: ${dashLine}`);
    }
    const starts = groups.slice(0, colCount).map((g) => g.start);
    const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1] : dashLine.length));
    return { starts, ends };
}
export async function parseTxt(fileName) {
    const fileContent = await readFile(fileName, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    const labels = ["ANNO", "PRAT.", "OGGETTO", "F.", "MAPP.", "CONC. ED.", "DATA", "INTESTATARIO"];
    const COLS = labels.length;
    const headerIndex = lines.findIndex((l) => l.includes("INTESTATARIO"));
    if (headerIndex === -1)
        throw new Error("Header line not found");
    // Find the dashed separator line AFTER the header line
    const dashIndex = lines.findIndex((l, idx) => idx > headerIndex && /-{2,}/.test(l));
    if (dashIndex === -1)
        throw new Error("Dash separator line not found after header");
    const dashLine = lines[dashIndex];
    const { starts, ends } = buildBoundsFromDashes(dashLine, COLS);
    const sliceCol = (line, i) => {
        const a = starts[i];
        const b = ends[i] ?? line.length;
        // guard for short lines
        if (a >= line.length)
            return "";
        return line.slice(a, Math.min(b, line.length)).trim();
    };
    const isHeaderLine = (line) => line.includes("INTESTATARIO") || line.trim().startsWith("ANNO") || line.includes("OGGETTO");
    const isNoise = (line) => !line.trim() || /-{2,}/.test(line.trim()) || line.includes("Pag.") || isHeaderLine(line);
    const isNewRecord = (row) => row[1].length > 0; // PRAT. present
    const isContinuation = (row) => row[1].length === 0 && (row[2].length > 0 || row[7].length > 0); // OGGETTO or INTESTATARIO text
    const mergeContinuation = (base, extra) => {
        const out = [...base];
        // merge only the fields that wrap in your data
        const WRAP = [2, 7]; // OGGETTO, INTESTATARIO
        for (const idx of WRAP) {
            if (!extra[idx])
                continue;
            out[idx] = out[idx] ? `${out[idx]} ${extra[idx]}` : extra[idx];
        }
        return out;
    };
    const rows = [];
    let current = null;
    let lastAnno = "";
    // Start parsing AFTER the dash line (data begins below it)
    for (let i = dashIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (isNoise(line))
            continue;
        const row = Array.from({ length: COLS }, (_, c) => sliceCol(line, c));
        // propagate year down
        if (!row[0])
            row[0] = lastAnno;
        else
            lastAnno = row[0];
        if (isNewRecord(row)) {
            if (current)
                rows.push(current);
            current = row;
            continue;
        }
        if (current && isContinuation(row)) {
            current = mergeContinuation(current, row);
            continue;
        }
    }
    if (current)
        rows.push(current);
    for (let i of rows) {
        if (!i[labels.indexOf("INTESTATARIO")])
            continue; // add a log in the column note saying that it could not be created
        try {
            if (!i[labels.indexOf("INTESTATARIO")]) {
                const applicant_query = {
                    ragsociale: `Sconosciuto`,
                };
                console.log(applicant_query);
                const queryResult = await createApplicant({
                    ragionesociale: applicant_query.ragsociale
                });
                const queryInstanceResult = await createInstance({
                    richiedente_id: queryResult.id,
                    anno: i[labels.indexOf("ANNO")] ?? "",
                    posizione: i[labels.indexOf("PRAT")] ?? "",
                    note: "Il richiedente è sconosciuto"
                });
            }
            else {
                const applicant_query = {
                    ragsociale: `${i[labels.indexOf("INTESTATARIO")]}`,
                };
                const queryResult = await createApplicant({
                    ragionesociale: applicant_query.ragsociale
                });
                const queryInstanceResult = await createInstance({
                    richiedente_id: queryResult.id,
                    anno: i[labels.indexOf("ANNO")] ?? "",
                    posizione: i[labels.indexOf("PRAT")] ?? "",
                    note: ""
                });
            }
        }
        catch (err) {
            throw new Error("something went wrong", { cause: err });
        }
    }
    return rows;
}
function parseCsv(fileName) {
}
async function main() {
    // const {path} = await inquirer.prompt([
    //     {
    //         type: "input",
    //         name: "path",
    //         message: "Enter the filePath",
    //         validate: (input) => input.length > 0 || "Path required"
    //     }
    // ])
    // const normalizedPath = path 
    // .trim()
    // .replace(/^['"]|['"]$/g, "")
    // .replace(/\\ /g, " ");
    // // if(normalizedPath.includes(".txt")) {
    // //     parseTxt(normalizedPath);
    // // }else if(normalizedPath.includes(".xlsx")) {
    //     parseXml("/Volumes/Andrea-ext/lavoro/nemea 13-01-2026/nemea_CONCESSIONI ass_87-89_1.xlsx");
    // // }
    parseTxt2(join(__dirname, "../", "files", "nemea_CONCESSIONI Ass_77-86.txt"));
}
main();
//# sourceMappingURL=index.js.map