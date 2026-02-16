import { resolve } from "node:path";
export const getEnv = (name, fallback = "") => {
    const env = process.env[name];
    return env && env !== "" ? env : fallback;
};
export const getEnvPath = (name, fallback = "") => {
    return resolve(process.cwd(), getEnv(name, fallback));
};
//# sourceMappingURL=env.js.map