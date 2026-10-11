function cleanEnv(val: string | undefined, fallback = ""): string {
  if (!val || val === "Secret value" || val.includes("replace-") || val.includes("example.invalid")) {
    return fallback;
  }
  return val;
}

export const ENV = {
  appId: cleanEnv(process.env.VITE_APP_ID, "ppfstudio-app"),
  cookieSecret: cleanEnv(process.env.JWT_SECRET, "ppfstudio-secret-jwt-key-2026-obsidian-atelier"),
  databaseUrl: cleanEnv(process.env.DATABASE_URL, ""),
  oAuthServerUrl: cleanEnv(process.env.OAUTH_SERVER_URL, ""),
  ownerOpenId: cleanEnv(process.env.OWNER_OPEN_ID, "ppfstudio-owner"),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: cleanEnv(process.env.BUILT_IN_FORGE_API_URL, ""),
  forgeApiKey: cleanEnv(process.env.BUILT_IN_FORGE_API_KEY, ""),
  operatorSignalingToken: cleanEnv(process.env.PPF_OPERATOR_SIGNALING_TOKEN, "ppfstudio-operator-sig-token-2026"),
  turnUrl: cleanEnv(process.env.PPF_TURN_URL, ""),
  turnUsername: cleanEnv(process.env.PPF_TURN_USERNAME, ""),
  turnCredential: cleanEnv(process.env.PPF_TURN_CREDENTIAL, ""),
};
