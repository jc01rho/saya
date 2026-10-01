// Generated from contracts/tsuba.openapi.json by bun run contract:generate. Do not edit.
export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Liveness, with no token, so a proxy can be checked apart from authentication. */
        get: operations["health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * What this adapter can do, and the limits its messenger enforces.
         * @description Like an AI API listing its models and what each supports. `revision` changes whenever anything else in the answer does, so a client can tell a held answer is stale. Today the features are network-wide; a room whose features differ will say so on the room itself once rooms are in this contract.
         */
        get: operations["capabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        PositiveInteger: number;
        /** @description Known codes. The set grows: keep a default branch. */
        ErrorCode: string;
        ErrorEnvelope: {
            /** @constant */
            ok: false;
            error: {
                code: components["schemas"]["ErrorCode"];
                message: string;
            };
        };
        Health: {
            /** @constant */
            ok: true;
        };
        Capabilities: {
            /** @constant */
            ok: true;
            contract: {
                /** @description The `info.version` of this document the adapter answers. */
                version: string;
            };
            adapter: {
                name: string;
                /** @description The adapter's own release, independent of the contract version. */
                version: string;
            };
            provider: {
                /** @description Stable, e.g. `telegram`. Do not infer features from it; read `features`. */
                id: string;
                /** @description For display. */
                name: string;
            };
            account: {
                /** @description `user`: the adapter acts as the person, seeing what their own client sees. `bot`: a bot account, seeing only where it was added. `official`: an official or business account. A client says which it is showing. */
                kind: string;
            };
            /** @description Opaque content hash of the declaration. */
            revision: string;
            features: components["schemas"]["Features"];
        };
        /** @description Supported features by id. Absent means unsupported. Ids under `x-<provider>.` are provider extensions; ignore any id you do not know. */
        Features: {
            /** @description List the conversations the account can see. */
            "rooms.list"?: Record<string, never>;
            /** @description Read a room's messages, oldest first. */
            "messages.read"?: {
                /** @description `none`: only the newest window. `before-id`: earlier pages before a message id. */
                paging: string;
                /** @description Most messages one read returns. */
                maxLimit: components["schemas"]["PositiveInteger"];
            };
            /** @description Receive new messages over SSE. */
            "messages.stream"?: {
                /** @description `none`: a reconnection starts from now. `cursor`: a reconnection resumes from per-room cursors without a gap. */
                resume: string;
            };
            /** @description Send text. */
            "messages.send"?: {
                /** @description Longest text the messenger accepts, in Unicode code points. */
                maxLength: components["schemas"]["PositiveInteger"];
                /** @description `accepted`: the messenger took the request, nothing more is known. `stored`: the answer carries the id of the message the messenger stored. */
                receipt: string;
            };
            /** @description Send a message as a reply to another. */
            "messages.reply"?: Record<string, never>;
            /** @description Edit a message the account sent. */
            "messages.edit"?: {
                /** @description Absent when the messenger sets no age limit. */
                maxAgeSeconds?: components["schemas"]["PositiveInteger"];
            };
            /** @description Delete a message. */
            "messages.delete"?: {
                /** @description Whether deletion removes it for every participant rather than only this account. */
                forEveryone: boolean;
            };
            /** @description Messages carry their reactions. */
            "reactions.read"?: Record<string, never>;
            /** @description Add or remove a reaction. */
            "reactions.send"?: {
                /** @description Absent when the messenger sets no limit. */
                maxPerMessage?: components["schemas"]["PositiveInteger"];
            };
            /** @description Mark a room read up to a message, as the messenger's own client would. */
            "read.mark"?: Record<string, never>;
            /** @description Show that the account is typing. */
            "typing.send"?: Record<string, never>;
            /** @description Read a thread under a message. A thread is not a room; a room is the conversation. */
            "threads.read"?: Record<string, never>;
            /** @description Download the files messages carry. */
            "attachments.read"?: Record<string, never>;
            /** @description Send a file. */
            "attachments.send"?: {
                /** @description Largest file the messenger accepts from this account. */
                maxBytes: components["schemas"]["PositiveInteger"];
                /** @description Whether a file can carry text with it. */
                caption: boolean;
            };
        } & {
            [key: string]: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The adapter is answering. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
        };
    };
    capabilities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The declaration. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Capabilities"];
                };
            };
            /** @description `UNAUTHORIZED`: missing or wrong bearer token. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
}
