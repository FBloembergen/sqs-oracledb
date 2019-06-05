/**
 * Helper function to be sure a certain environment variable is set
 */
export function getEnv(key: string) {
    const val = process.env[key];
    if (!val) { throw new Error(`missing environment variable ${key}`); }
    return val;
}

/**
 * Helper function parse environment key to number or boolean
 */
export function parseEnvVar(key: string): string | number | boolean {
    const val = getEnv(key);
    const base = 10;
    if (!isNaN(parseInt(val, base))) {
        return parseInt(val, base);
    } else if (val.toLowerCase() === 'true') {
        return true;
    } else if (val.toLowerCase() === 'false') {
        return false;
    } else { return val; }
}

