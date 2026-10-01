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
    "/rooms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The conversations the account can see, as its own client lists them.
         * @description Feature `rooms.list`. Rooms come in the order the messenger's own client shows them (pinned first, then by latest activity). An adapter may stop at a cap of its own; `complete: false` says it did and that more rooms exist.
         */
        get: operations["rooms"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * A room's messages, oldest first.
         * @description Feature `messages.read`. Without `before`, the newest `limit` messages; with it, the `limit` messages just before that id. `hasEarlier` says whether older ones exist. `before` paging is answered only when the feature declares `paging: before-id`.
         */
        get: operations["messages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/stream": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * New messages as Server-Sent Events.
         * @description Feature `messages.stream`. The same shape the KakaoTalk cores use: `ready` once, then `message` per message with a `cursor` after the messages it covers, `ping` while quiet, and `error` once before the stream ends. With `resume: cursor`, a reconnection hands back the last cursor as repeated `since=<roomId>:<messageId>` (split at the last colon) and the adapter sends what each named room received after that id before going live; a room not named starts from now. A cursor the adapter cannot honour is refused, never downgraded to now.
         */
        get: operations["stream"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Send text to a room.
         * @description Feature `messages.send`. Sends are one at a time per adapter; at most four wait, and a fifth is `429 RATE_LIMITED` having changed nothing. With `receipt: stored` the answer carries the message the messenger stored. A send whose outcome is uncertain is never retried by the adapter.
         */
        post: operations["send"];
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
        /** @description A conversation. A key that does not apply is absent, never null or false. */
        Room: {
            /** @description Opaque. Compare, store and send it back as the string it is; never as a number. */
            id: string;
            /** @description What the messenger's own client shows as the room's name. */
            title: string;
            /** @description `direct`: one other account (person or bot). `group`: several members who can all write. `channel`: a broadcast most members only read. */
            kind: string;
            /** @description The messenger's own unread count for this account. */
            unread: number;
            /**
             * Format: date-time
             * @description When the newest message arrived.
             */
            lastActivityAt?: string;
            /** @description The newest message, for a list preview. */
            lastMessage?: {
                /** @description At most its first 200 code points. Empty when the message has no text (a photo, a sticker). */
                text: string;
                fromMe: boolean;
            };
        };
        RoomsAnswer: {
            /** @constant */
            ok: true;
            rooms: components["schemas"]["Room"][];
            /** @description `false` when the adapter stopped at its own cap and more rooms exist. */
            complete: boolean;
        };
        /** @description A key that does not apply is absent. */
        Message: {
            /** @description Opaque; send it back as is. */
            id: string;
            roomId: string;
            senderId?: string;
            /** @description The name the messenger shows for the sender (a channel's own title for its posts). */
            sender: string;
            /** @description Empty when the message carries no text. */
            text: string;
            /** @description `media`: a photo, file, sticker, voice and so on, with `text` its caption. `service`: a join, a title change and the like. */
            kind: string;
            /** Format: date-time */
            sentAt: string;
            /** Format: date-time */
            editedAt?: string;
            fromMe: boolean;
            /** @description The id of the message this replies to. */
            replyTo?: string;
        };
        MessagesAnswer: {
            /** @constant */
            ok: true;
            messages: components["schemas"]["Message"][];
            hasEarlier: boolean;
        };
        /** @description Room id to the id of the last message the stream sent for it. */
        Cursor: {
            [key: string]: string;
        };
        StreamReady: {
            /** @constant */
            ok: true;
            resumed: boolean;
            cursor: components["schemas"]["Cursor"];
        };
        StreamMessage: {
            /** @constant */
            ok: true;
            message: components["schemas"]["Message"];
        };
        StreamCursor: {
            /** @constant */
            ok: true;
            cursor: components["schemas"]["Cursor"];
        };
        StreamPing: {
            /** @constant */
            ok: true;
        };
        SendRequest: {
            roomId: string;
            text: string;
        };
        SendAnswer: {
            /** @constant */
            ok: true;
            message: components["schemas"]["Message"];
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
    rooms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The rooms. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoomsAnswer"];
                };
            };
            /** @description `UNAUTHORIZED`. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `RATE_LIMITED`: the messenger asked the adapter to slow down; nothing changed. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `INTERNAL`: the adapter failed; the message says nothing about the account. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `NOT_SUPPORTED`: this adapter does not declare `rooms.list`. */
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    messages: {
        parameters: {
            query: {
                roomId: string;
                /** @description At most the feature's `maxLimit`; more is a 400. */
                limit?: number;
                /** @description A message id from an earlier answer. */
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The messages. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessagesAnswer"];
                };
            };
            /** @description `INVALID_REQUEST`. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `UNAUTHORIZED`. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `NOT_FOUND`: no such room. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `RATE_LIMITED`. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `INTERNAL`. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `NOT_SUPPORTED`. */
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    stream: {
        parameters: {
            query?: {
                since?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description An event stream. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
            /** @description `INVALID_REQUEST`: a malformed `since`. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `UNAUTHORIZED`. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `NOT_SUPPORTED`. */
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `BUSY`: the adapter already holds as many streams as it will (8). */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    send: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendRequest"];
            };
        };
        responses: {
            /** @description Stored. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SendAnswer"];
                };
            };
            /** @description `INVALID_REQUEST`: empty, or longer than `maxLength` code points. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `UNAUTHORIZED`. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `NOT_FOUND`: no such room. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `RATE_LIMITED`: the line is full or the messenger asked to slow down. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `INTERNAL`. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description `NOT_SUPPORTED`. */
            501: {
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
