import type { UrbexConfig } from "./exportable-types";

import { environment, Environment } from "./environment";
import { UrbexClient, isUrbexClient } from "./core/urbex";
import { PipelineExecutor } from "./core/pipelines";

/**
 * The extended client that has other methods attached to it
 * that are not part of the core client.
 */
export interface ExtendedUrbexClient extends UrbexClient {
    /**
     * Create a new isolated instance of the Urbex client
     *
     * Any existing configuration will be copied to the new
     * instance. Furthermore, changes made to the new instance
     * will not affect the original instance
     */
    isolateClient(config?: UrbexConfig): UrbexClient;
    /**
     *
     * TypeScript safe guard to check if an object is an instance of UrbexClient
     */
    isUrbexClient(client: unknown): client is UrbexClient;
    /**
     * The underlying UrbexClient class which can be used to create new instances
     *
     * Recommended to use `isolateClient` instead
     */
    Client: typeof UrbexClient;
    /**
     * The current environment of the project
     */
    environment: Environment;
}

function createClient(): ExtendedUrbexClient {
    const client = UrbexClient.create();
    const extendedClient = client as ExtendedUrbexClient;

    extendedClient.isolateClient = UrbexClient.create;
    extendedClient.environment = environment;
    extendedClient.isUrbexClient = isUrbexClient;
    extendedClient.Client = UrbexClient;

    return extendedClient;
}

const urbex = createClient();

export * from "./exportable-types";
export * from "./core/pipelines";
// export * from "./core/headers";
export * from "./core/parsers/url-parser";
export * from "./core/error";

export default urbex;
