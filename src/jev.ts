import {
  type Questions,
  type SystemOneRequest,
  type SystemOneResult,
  TypeSafeClient,
  type TypeSafeClientConfig,
} from "@typesafe-ai/sdk";

/**
 * The one thing the pipeline needs from Jev. Tests inject a fake; production wraps the SDK.
 */
export interface Jev {
  systemOne<const Q extends Questions>(request: SystemOneRequest<Q>): Promise<SystemOneResult<Q>>;
}

export function createJev(config?: TypeSafeClientConfig): Jev {
  const client = new TypeSafeClient(config);
  return {
    systemOne: (request) => client.systemOne(request),
  };
}
