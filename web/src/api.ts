// The one client the app talks to; everything else comes from @real-world/sdk.
import { Client } from "@real-world/sdk";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const rw = new Client(API_URL);
