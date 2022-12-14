import chai from "chai";

import { PORT, SERVER_URL } from "../constants";

import urbex, {
    NetworkError,
    PipelineError,
    PipelineExecutor,
    TimeoutError,
    UrbexError
} from "../../lib/urbex";

const client = urbex.isolateClient({
    url: SERVER_URL
});

describe("errors (integration)", () => {
    beforeEach(() => {
        client.reset();

        client.configure({
            url: SERVER_URL
        });
    });

    it("should catch errors", async () => {
        try {
            await client.get("/404");
        } catch (error) {
            chai.expect(error).to.be.an.instanceOf(UrbexError);
            chai.expect(error.name).to.equal("UrbexError");
            chai.expect(error.status).to.equal(404);
            chai.expect(error).to.have.property("status");
            chai.expect(error).to.have.property("config");
            chai.expect(error).to.have.property("request");
            chai.expect(error).to.have.property("response");
            chai.expect(error).to.have.property("message");
        }
    });

    it("the configuration object should be apart of the error", async () => {
        try {
            await client.get("/404", {
                responseType: "text",
                responseEncoding: "ascii"
            });
        } catch (error) {
            chai.expect(error.config).to.be.an("object");
            chai.expect(error.name).to.equal("UrbexError");
            chai.expect(error.config).to.have.property("responseType");
            chai.expect(error.config).to.have.property("responseEncoding");
        }
    });

    it("should catch errors from the pipeline, including custom errors", async () => {
        try {
            await client.get("/404", {
                pipelines: {
                    request: [
                        new PipelineExecutor(() => {
                            throw new Error("My custom error message");
                        })
                    ]
                }
            });
        } catch (error) {
            chai.expect(error).to.be.an.instanceOf(PipelineError);
            chai.expect(error.name).to.equal("PipelineError");
            chai.expect(error.message).to.equal("My custom error message");
        }

        try {
            await client.get("/404", {
                pipelines: {
                    request: [
                        new PipelineExecutor(() => {
                            throw new NetworkError("A network error is thrown");
                        })
                    ]
                }
            });
        } catch (error) {
            chai.expect(error).to.be.an.instanceOf(UrbexError);
            chai.expect(error.name).to.equal("NetworkError");
            chai.expect(error.message).to.equal("A network error is thrown");
        }
    });

    it("should catch errors from `resolveStatus` option", async () => {
        try {
            await client.get("/404", {
                resolveStatus: () => {
                    throw new Error("This is a test error");
                }
            });
        } catch (error) {
            chai.expect(error).to.be.an.instanceOf(Error);
            chai.expect(error.name).to.equal("UrbexError");
            chai.expect(error.message).to.equal("This is a test error");
        }
    });

    it("should throw a TimeoutError", async () => {
        try {
            await client.get("/delay/250", {
                timeout: 100
            });
        } catch (error) {
            chai.expect(error).to.be.an.instanceOf(Error);
            chai.expect(error.name).to.equal("TimeoutError");
            chai.expect(error.message).to.equal("Timeout of 100ms exceeded");
        }
    });

    it("should throw a NetworkError", async function () {
        this.timeout(3000);

        try {
            await client.get("http://localhost:9999");
        } catch (error) {
            chai.expect(error).to.be.an.instanceOf(Error);
            chai.expect(error.name).to.equal("NetworkError");
            chai.expect(error).to.have.property("message");
            chai.expect(error).to.have.property("config");
            chai.expect(error).to.have.property("request");
        }
    });
});
