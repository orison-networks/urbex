import { URLParser } from "./core/parsers/url-parser";

export type UrbexContext = "browser" | "node";

export class Environment {
    private _context: UrbexContext;

    constructor() {
        this._context = this.detectContext();
    }

    private detectContext(): UrbexContext {
        if (typeof window !== "undefined" && typeof window.document !== "undefined") {
            return "browser";
        }

        if (typeof process !== "undefined" && process.versions && process.versions.node) {
            return "node";
        }

        throw new Error("Unable to detect environment context.");
    }

    private nodeStrictCheck(): void {
        if (this.isBrowser) {
            throw new Error("This method is not available in the browser environment.");
        }
    }

    get process(): NodeJS.Process {
        if (this.isNode) {
            return process;
        }

        return {} as NodeJS.Process;
    }

    get context(): UrbexContext {
        return this._context;
    }

    get isBrowser(): boolean {
        return this.context === "browser";
    }

    get isNode(): boolean {
        return this.context === "node";
    }

    get isDevelopment(): boolean {
        this.nodeStrictCheck();

        return process.env.NODE_ENV === "development";
    }

    get isProduction(): boolean {
        this.nodeStrictCheck();

        return process.env.NODE_ENV === "production";
    }

    public getEnvironmentComponent(): URLParser {
        if (this.isBrowser) {
            return URLParser.parse(window.location.href);
        } else {
            const port = process.env.PORT || "3000";
            const parsed = URLParser.parse(`http://localhost:${port}`);

            return parsed;
        }
    }
}

export const environment = new Environment();
