import http from "http";
import https from "https";
import url from "url";

import type {
    DispatchedResponse,
    UrbexRequestApi,
    URLProtocol,
    ParsedClientConfiguration
} from "../types";

import {
    createPromise,
    combineStrings,
    argumentIsNotProvided,
    toStringCall
} from "../../utils";

function formProtocol(protocol: string): string {
    if (protocol.endsWith(":")) {
        return protocol;
    }

    return `${protocol}:`;
}

function constructBody(body: any): Buffer {
    if (argumentIsNotProvided(body)) {
        return undefined;
    }

    if (Buffer.isBuffer(body)) {
        return body;
    } else if (toStringCall(body) === "ArrayBuffer") {
        return Buffer.from(new Uint8Array(body));
    }
}

export class NodeRequest implements UrbexRequestApi {
    private getAgentFromProtocol(
        protocol: URLProtocol
    ): typeof http | typeof https {
        if (protocol === "http") {
            return http;
        }

        if (protocol === "https") {
            return https;
        }

        throw new Error(
            `Urbex expected a valid protocol to create a request agent, but got ${protocol}.`
        );
    }

    public async send(config: ParsedClientConfiguration): DispatchedResponse {
        return createPromise((resolve, reject) => {
            const agent = this.getAgentFromProtocol(config.url.protocol);

            const agentRequestconfig: https.RequestOptions = {
                protocol: formProtocol(config.url.protocol),
                hostname: config.url.hostname,
                path: combineStrings(
                    "",
                    config.url.endpoint,
                    config.url.params as string
                ),
                headers: config.headers.get(),
                port: config.url.port
            };

            const req = agent.request(agentRequestconfig, (res) => {
                const { statusCode } = res;

                let error: Error | null = null;

                if (error) {
                    res.resume();
                    reject(error);
                    return;
                }

                res.setEncoding("utf8");

                let rawData = "";

                res.on("data", (chunk) => {
                    rawData += chunk;
                });

                res.on("end", () => {
                    try {
                        resolve({
                            data: rawData,
                            headers: res.headers,
                            status: statusCode,
                            statusText: res.statusMessage,
                            request: req
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on("error", (e) => {
                reject(e);
            });

            req.end(config.data);
        });
    }
}
