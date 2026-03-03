// @ts-ignore
declare const Deno: any;

export const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://aircreator.cloud/publisher";
export const BACKEND_GATEWAY_URL = Deno.env.get("BACKEND_GATEWAY_URL") || "http://93.127.216.83:5003";
export const AUTOMATION_WEBHOOK_URL = "http://93.127.216.83:5003/webhook";

