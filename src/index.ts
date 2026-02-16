import {join, dirname} from "node:path";
import xlsx from "node-xlsx";
import fs from "node:fs";
import "dotenv/config";
import { createApplicant, createInstance } from "./respository/ApplicantRepository.js";
import {readFile} from "fs/promises";
import inquirer from "inquirer";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Applicant {
    ragsociale: string;
    indirizzo: string;
}

const parseXml = async (fileName: string) => {
    interface Applicant {
        ragsociale: string;
        indirizzo: string;        
    }

    interface Instance {
        richiedente_id: number;
        anno: string;
        posizione: string;
        note: string;
    }

    const workSheetFromFile = xlsx.parse(fs.readFileSync(fileName));

    for(let file of workSheetFromFile) {
        const header = file.data[0];
        const data = file.data;
                
        if(!header)
            throw new Error("Header is missing");

        for(let row of data) {
            if(!row || row.length === 0) continue;
            
            const applicant: Partial<Applicant> = {};
            
            //TODO: create a separate function for this 
            const firstLine = row[0]?.toLocaleString();

            if(firstLine?.startsWith("KS")) {
                const ksData = row[0].split(" ");
                console.log(ksData);

                if(ksData.length < 2) continue;

                applicant.ragsociale = ksData[2];
                applicant.indirizzo = "";

                try {
              
                    const queryResult = await createApplicant({ragionesociale: applicant.ragsociale, via: applicant.indirizzo});
            
                    const instance: Instance = {
                        richiedente_id: queryResult.id,
                        anno: "",
                        posizione: ksData[1],
                        note: "Creato da un file KS, gli unici dati presenti sono posizione e ragione sociale"
                    };
    
        
                    const queryInstanceResult = await createInstance(instance);
            
                    continue;
                }catch(err) {
                    throw new Error("something went wrong", {cause: err})
                } 

            }

            const name = row[header.indexOf("NOME")];
            const nameLastName = row[header.indexOf("COGNOME E NOME")];
            applicant.ragsociale = name ? `${name} ${row[header.indexOf("COGNOME")] ?? ""}` : nameLastName ? nameLastName : "Sconosciuto";
            applicant.indirizzo = row[header.indexOf("INDIRIZZO")] ?? "";

      

            try {
              
                const queryResult = await createApplicant({ragionesociale: applicant.ragsociale, via: applicant.indirizzo});
        
                const instance: Instance = {
                    richiedente_id: queryResult.id ,
                    anno: row[header.indexOf("ANNO")] ?? "",
                    posizione: /^\d+$/.test(row[header.indexOf("NUMERO")]) ? row[header.indexOf("NUMERO")] :  "",
                    note: name ? "" : "Il richiedente dell'istanza è sconosciuto"
                };
    
                const queryInstanceResult = await createInstance(instance);
        
                console.log("Instance created", instance);
            }catch(err) {
                throw new Error("something went wrong", {cause: err})
            }    
        } 
    }
}

const parseTxt = async (fileName: string) => {
    type Instance = {
        richiedente_id: number;
        anno: string;
        posizione: string;
        note: string;
    }

    const fileContent = await readFile(fileName, "utf-8");
    const lines: string[] = fileContent.split(/\r?\n/);

    const headerIndex = lines.findIndex(l => 
        l.includes("INTESTATARIO")
        || l.startsWith("ANNO") 
        || l.includes("PRAT.")
        || l.includes("NUM.")
    );

    if(headerIndex === -1)
        throw new Error("Header line not found");

 
    const columns = lines[headerIndex]?.trim()?.split(/\s{2,}/) as readonly string[];
    
    type Applicant = Partial<Record<Lowercase<(typeof columns)[number]>, string>>;

    const dashIndex = lines.findIndex((l, idx) => idx > headerIndex && /-{2,}/.test(l));
  
    const dashLine = lines[dashIndex] as string;
    
    if (dashIndex === -1) 
        throw new Error("Dash separator line not found after header");

    const indexes = Array.from(dashLine?.matchAll(/-+/g)).map(itm => {
        return {
            start: itm.index ?? 0,
            end: (itm.index ?? 0) + itm[0].length
        }
    });
    
    type cln = Lowercase<(typeof columns)[number]>;
    
    // type cln3 = [K in typeof columns[number] as Lowercase<K>]
      
    const applicant: Partial<Applicant> = {};

    for (let i = headerIndex + 1; i < lines.length; i++) {
        
        if(lines[i]?.match(/-+/g) || lines[i]?.includes("Pag.")) continue;

        for(let j = 0; j < indexes.length; j++){
            const data = indexes[j] as {start: number;end: number;};
            const key = columns[j]?.toLocaleLowerCase() as cln;
            
            applicant[key] = lines[i]?.substring(data.start,data.end) ?? "";
        }

        applicant.intestatario = applicant.intestatario ? applicant.intestatario : "Sconosciuto";


        try {
            const applicant_query: {ragsociale: string} = {
                ragsociale: `${applicant.intestatario}`,
            };
        
            const queryResult = await createApplicant({
                    ragionesociale: applicant_query.ragsociale,
                }
            );
            
            const instance: Instance = {
                richiedente_id: queryResult.id,
                anno: applicant.anno ?? "",
                posizione: applicant["prat."] ?? "",
                note: applicant.intestatario === "Sconosciuto" ? "Il richiedente dell'istanza è sconosciuto" : ""
            };

            const queryInstanceResult = await createInstance(instance);
        }catch(err) {
            throw new Error("something went wrong", {cause: err})
        }

    }
}


async function main() {
    const {path} = await inquirer.prompt([
        {
            type: "input",
            name: "path",
            message: "Enter the filePath",
            validate: (input) => input.length > 0 || "Path required"
        }
    ])

    const normalizedPath = path 
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\ /g, " ");


    if(normalizedPath.includes(".txt")) 
        parseTxt(normalizedPath);
    else if(normalizedPath.includes(".xlsx")) 
        parseXml(normalizedPath); 
}

main();