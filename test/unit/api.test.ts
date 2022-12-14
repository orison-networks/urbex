import chai from "chai";

import urbex, { URLParser, PipelineExecutor } from "../../lib/urbex";
import { RequestApi } from "../../lib/core/api/request-api";
import { NodeRequest } from "../../lib/core/api/http";
import { BrowserRequest } from "../../lib/core/api/xhr";
import { environment } from "../../lib/environment";

const client = new urbex.Client();

describe("api", () => {
    beforeEach(() => {
        client.reset();
    });

    it("should have configure method", () => {
        chai.expect(client).to.have.property("configure");
        chai.expect(client.configure).to.be.a("function");
    });

    it("should have reset method", () => {
        chai.expect(client).to.have.property("reset");
        chai.expect(client.reset).to.be.a("function");
    });

    it("should have http method alias", () => {
        chai.expect(urbex).to.have.property("get");
        chai.expect(urbex).to.have.property("post");
        chai.expect(urbex).to.have.property("put");
        chai.expect(urbex).to.have.property("patch");
        chai.expect(urbex).to.have.property("delete");
        chai.expect(urbex).to.have.property("head");
        chai.expect(urbex).to.have.property("options");
    });

    it("should expose the current config", () => {
        client.configure({
            method: "POST",
            url: "https://example.com",
            data: {
                foo: "bar"
            },
            responseType: "json",
            responseEncoding: "utf8"
        });

        const config = client.config;

        chai.expect(config).to.be.an("object");
        chai.expect(config.method).to.equal("POST");
        chai.expect(config.url.href).to.equal("https://example.com");
        chai.expect(config.data).to.deep.equal({
            foo: "bar"
        });

        chai.expect(config.responseType).to.equal("json");
        chai.expect(config.responseEncoding).to.equal("utf8");
    });

    it("should expose the cache module", () => {
        client.configure({
            cache: {
                enabled: false,
                maxItems: 420
            }
        });

        chai.expect(client.cache).to.be.an("object");
        chai.expect(client.cache.options.maxItems).to.equal(420);
    });

    it("should expose the PipelineExecutor class (named)", () => {
        chai.expect(PipelineExecutor).to.not.be.undefined;
        chai.expect(PipelineExecutor).to.be.a("function");
    });

    it("should expose the URLParser class (named)", () => {
        chai.expect(URLParser).to.not.be.undefined;
        chai.expect(URLParser).to.be.a("function");
    });

    it("should return a promise when invoking a request", () => {
        const request = client.get("https://example.com");

        chai.expect(request).to.be.an.instanceOf(Promise);
        chai.expect(request).to.have.property("then");
        chai.expect(request).to.have.property("catch");
        chai.expect(request).to.have.property("finally");
    });

    it("the request api should be an instance of NodeRequest when running in node", function () {
        if (environment.isBrowser) {
            this.skip();
        }

        const request = new RequestApi();

        // @ts-expect-error
        chai.expect(request.$api).to.be.an.instanceOf(NodeRequest);
    });

    it("the request api should be an instance of BrowserRequest when running in the browser", function () {
        if (!environment.isBrowser) {
            this.skip();
        }

        const request = new RequestApi();

        // @ts-expect-error
        chai.expect(request.$api).to.be.an.instanceOf(BrowserRequest);
    });
});
