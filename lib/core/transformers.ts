import type { RequestExecutor, ResponseExecutor } from "../exportable-types";

import { REQUEST_BODY_METHODS } from "./constants";
import { PipelineExecutor } from "./pipelines";
import { environment } from "../environment";
import { DECODERS } from "./api/http";
import { safeJSONParse, uppercase } from "../utils";

const SKIPPABLE_RESPONSE_TYPES = ["stream", "raw"];

export const transformRequestData = new PipelineExecutor<RequestExecutor>((config) => {
    if (REQUEST_BODY_METHODS.includes(uppercase(config.method))) {
        config.headers.set({
            "Content-Type": "application/x-www-form-urlencoded"
        });
    }

    return Promise.resolve(config);
});

// the below `decodeResponseData` is only used for NodeJS

export const decodeResponseData = new PipelineExecutor<ResponseExecutor>(async (response) => {
    const { responseType, maxContentLength } = response.config;

    if (SKIPPABLE_RESPONSE_TYPES.includes(responseType) || response.cache.pulled) {
        return Promise.resolve(response);
    }

    const encoding = response.headers["content-encoding"];

    if (Buffer.isBuffer(response.data) && response.data.length) {
        if (encoding) {
            const decoder = DECODERS[encoding];

            if (decoder) {
                const decompressed = await decoder(response.data);

                if (maxContentLength > -1 || maxContentLength !== Infinity) {
                    if (decompressed.length > maxContentLength) {
                        throw new Error(
                            `Content length of ${decompressed.length} exceeds the maxContentLength of ${maxContentLength}`
                        );
                    }
                }

                response.data = decompressed;
            }
        }
    } else {
        response.data = null;
    }

    return Promise.resolve(response);
});

export const transformResponseData = new PipelineExecutor<ResponseExecutor>((response) => {
    const { responseType, responseEncoding } = response.config;

    if (
        SKIPPABLE_RESPONSE_TYPES.includes(responseType) ||
        responseType === "arraybuffer" ||
        response.cache.pulled
    ) {
        return Promise.resolve(response);
    }

    if (response.data) {
        let data = response.data;

        if (environment.isNode) {
            // https://stackoverflow.com/questions/24356713/node-js-readfile-error-with-utf8-encoded-file-on-windows

            data = response.data.toString(responseEncoding);
        }

        if (responseType === "json") {
            response.data = safeJSONParse(data, true);
        } else {
            response.data = data;
        }
    }

    return Promise.resolve(response);
});
