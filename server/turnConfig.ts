export type IceServerConfig = {
  urls: string[];
  username?: string;
  credential?: string;
};

export type TurnConfigInput = {
  turnUrl?: string;
  turnUsername?: string;
  turnCredential?: string;
};

const DEFAULT_STUN_URL = "stun:stun.l.google.com:19302";

/**
 * Builds the server-provided ICE configuration. TURN is only included when
 * all three values are present; incomplete credentials fail closed to STUN.
 */
export function buildIceServers(input: TurnConfigInput): IceServerConfig[] {
  const servers: IceServerConfig[] = [{ urls: [DEFAULT_STUN_URL] }];
  const turnUrl = input.turnUrl?.trim();
  const turnUsername = input.turnUsername?.trim();
  const turnCredential = input.turnCredential?.trim();

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({ urls: [turnUrl], username: turnUsername, credential: turnCredential });
  }

  return servers;
}

export function buildIceServersFromEnv(env: NodeJS.ProcessEnv = process.env) {
  return buildIceServers({
    turnUrl: env.PPF_TURN_URL,
    turnUsername: env.PPF_TURN_USERNAME,
    turnCredential: env.PPF_TURN_CREDENTIAL,
  });
}
