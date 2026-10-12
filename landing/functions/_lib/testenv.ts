// Test-only: read process env without pulling Node types into the Workers config.
declare const process: { env: Record<string, string | undefined> };
export const DATABASE_URL_DEV = process.env.DATABASE_URL_DEV;
