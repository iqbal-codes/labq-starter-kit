// Minimal global declarations for the runtime helpers this package relies on.
// The api-client runs in both browser and Node environments, but its tsconfig
// intentionally excludes DOM lib to keep the package portable. Declare only
// the surface we use rather than pulling in the full DOM lib.
declare global {
  function fetch(
    input: string | URL | Request,
    init?: {
      headers?: HeadersInit;
      body?: BodyInit | null;
      credentials?: RequestCredentials;
    },
  ): Promise<Response>;
}

export {};
