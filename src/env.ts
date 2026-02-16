import {resolve} from "node:path";

export const getEnv = (name: string, fallback = ""): string => {
    const env = process.env[name];
    return env && env !== "" ? env : fallback; 
}

export const getEnvPath = (name: string, fallback = ""): string => {
    return resolve(process.cwd(), getEnv(name,fallback));
}