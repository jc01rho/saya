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
         * @description Like an AI API listing its models and what each supports. A client checks `contract.version` against its own range before anything else. `revision` changes whenever anything else in the answer does, so a client can tell a held answer is stale. The declaration is network-wide; a room where it differs says so in `Room.features`.
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
         * @description Feature `rooms.list`. Rooms come in the order the messenger's own client shows them (pinned first, then by latest activity). An adapter may stop at a cap of its own; `complete: false` says it did and that more rooms exist. A room whose features differ from the declaration carries `features`.
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
         * @description Feature `messages.read`. Without `before`, the newest `limit` messages; with it, the `limit` messages just before that id. `hasEarlier` says whether older ones exist. `before` paging is answered only when the feature declares `paging: before-id`; a `limit` above the feature's `maxLimit` is `400 INVALID_REQUEST`.
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
    "/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The bytes of a file a message carries.
         * @description Feature `attachments.read`. `id` is the `id` of an entry in a message's `attachments`. The bytes are someone else's, so the answer is made safe to open at the client's own origin: `content-security-policy: default-src 'none'; sandbox` and `x-content-type-options: nosniff` always; the attachment's own type, served `inline`, only when it is one a browser draws or plays without running anything (JPEG, PNG, GIF, WebP and AVIF images; MP4, WebM and Ogg video; MPEG, Ogg, MP4, AAC, WebM, WAV and FLAC audio); anything else as `application/octet-stream` and `attachment`. An id answers the same bytes for as long as it answers at all (a message whose file is replaced carries a new id), so the answer may be kept in a private cache.
         */
        get: operations["media"];
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
         * @description Feature `messages.stream`. The same shape the KakaoTalk cores use: `ready` once, then `message` per message with a `cursor` after the messages it covers, `ping` while quiet, and `error` once before the stream ends. With `resume: cursor`, a reconnection hands back the last cursor as repeated `since=<roomId>:<messageId>` (split at the last colon) and the adapter sends what each named room received after that id before going live; a room not named starts from now. A cursor the adapter cannot honour is refused, never downgraded to now. An `error` event carries any code a read can answer. A client skips an event this version does not list; names in use or reserved for later versions are in tsuba's `docs/contract.md`.
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
         * @description Feature `messages.send`. Sends are one at a time per adapter; at most four wait, and a fifth is `429 RATE_LIMITED` having changed nothing. Text that is empty or longer than the feature's `maxLength` code points is `400 INVALID_REQUEST`. With `receipt: stored` the answer carries the message the messenger stored. Every error but `INTERNAL` means nothing was sent; a send whose outcome is uncertain is never retried by the adapter.
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
        /**
         * @description Known codes, each with its one HTTP status. The set grows: keep a default branch.
         *
         *     - `UNAUTHORIZED` 401: the bearer token is missing or wrong.
         *     - `INVALID_REQUEST` 400: the request is malformed or outside a declared limit.
         *     - `NOT_FOUND` 404: no such route, room, message or attachment for this account.
         *     - `METHOD_NOT_ALLOWED` 405: the route answers another method, named in `Allow`.
         *     - `NOT_SUPPORTED` 501: the adapter does not declare the route's feature.
         *     - `RATE_LIMITED` 429: the adapter's line is full or the messenger asked it to slow down.
         *     - `BUSY` 503: the adapter holds as many streams as it will.
         *     - `INTERNAL` 500: the adapter failed; the message says nothing about the account. On a write, the outcome is unknown.
         *     - `FORBIDDEN` 403: the messenger does not let this account do this here (a channel it cannot post in, a group that restricted or banned it).
         *     - `REAUTH_REQUIRED` 503: the messenger no longer accepts the adapter's session (signed out, revoked or expired); a person signs in again where the adapter runs.
         */
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
                /** @description The `info.version` of this document the adapter answers. A client checks it against its own caret range before anything else. */
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
        /** @description Supported features by id, each with the limits its messenger enforces. Absent means unsupported. Ids under `x-<provider>.` are provider extensions; ignore any id you do not know. */
        Features: {
            "rooms.list"?: components["schemas"]["FeatureRoomsList"];
            "messages.read"?: components["schemas"]["FeatureMessagesRead"];
            "messages.stream"?: components["schemas"]["FeatureMessagesStream"];
            "messages.send"?: components["schemas"]["FeatureMessagesSend"];
            "messages.reply"?: components["schemas"]["FeatureMessagesReply"];
            "messages.edit"?: components["schemas"]["FeatureMessagesEdit"];
            "messages.delete"?: components["schemas"]["FeatureMessagesDelete"];
            "reactions.read"?: components["schemas"]["FeatureReactionsRead"];
            "reactions.send"?: components["schemas"]["FeatureReactionsSend"];
            "read.mark"?: components["schemas"]["FeatureReadMark"];
            "typing.send"?: components["schemas"]["FeatureTypingSend"];
            "threads.read"?: components["schemas"]["FeatureThreadsRead"];
            "attachments.read"?: components["schemas"]["FeatureAttachmentsRead"];
            "attachments.send"?: components["schemas"]["FeatureAttachmentsSend"];
        } & {
            [key: string]: Record<string, never>;
        };
        /** @description List the conversations the account can see: `GET /rooms`. */
        FeatureRoomsList: Record<string, never>;
        /** @description Read a room's messages, oldest first: `GET /messages`. */
        FeatureMessagesRead: {
            /** @description `none`: only the newest window. `before-id`: earlier pages before a message id. */
            paging: string;
            /** @description Most messages one read returns. */
            maxLimit: components["schemas"]["PositiveInteger"];
        };
        /** @description Receive new messages over SSE: `GET /stream`. */
        FeatureMessagesStream: {
            /** @description `none`: a reconnection starts from now. `cursor`: a reconnection resumes from per-room cursors without a gap. */
            resume: string;
        };
        /** @description Send text: `POST /send`. */
        FeatureMessagesSend: {
            /** @description Longest text the messenger accepts, in Unicode code points. */
            maxLength: components["schemas"]["PositiveInteger"];
            /** @description `accepted`: the messenger took the request, nothing more is known. `stored`: the answer carries the id of the message the messenger stored. */
            receipt: string;
        };
        /** @description Reserved. Send a message as a reply to another: `replyTo` on `POST /send`. */
        FeatureMessagesReply: Record<string, never>;
        /** @description Reserved. Edit a message the account sent: `POST /edit`. */
        FeatureMessagesEdit: {
            /** @description Absent when the messenger sets no age limit. */
            maxAgeSeconds?: components["schemas"]["PositiveInteger"];
        };
        /** @description Reserved. Delete a message: `POST /delete`. */
        FeatureMessagesDelete: {
            /** @description Whether deletion removes it for every participant rather than only this account. */
            forEveryone: boolean;
        };
        /** @description Reserved. Messages carry their reactions: `Message.reactions`. */
        FeatureReactionsRead: Record<string, never>;
        /** @description Reserved. Add or remove a reaction: `POST /react`. */
        FeatureReactionsSend: {
            /** @description Absent when the messenger sets no limit. */
            maxPerMessage?: components["schemas"]["PositiveInteger"];
        };
        /** @description Reserved. Mark a room read up to a message, as the messenger's own client would: `POST /read`. */
        FeatureReadMark: Record<string, never>;
        /** @description Reserved. Show that the account is typing: `POST /typing`. */
        FeatureTypingSend: Record<string, never>;
        /** @description Reserved. Read a thread under a message: `GET /thread`. A thread is not a room; a room is the conversation. */
        FeatureThreadsRead: Record<string, never>;
        /** @description Messages carry `attachments`, and `GET /media` answers their bytes. */
        FeatureAttachmentsRead: Record<string, never>;
        /** @description Reserved. Send a file: `POST /upload`. */
        FeatureAttachmentsSend: {
            /** @description Largest file the messenger accepts from this account. */
            maxBytes: components["schemas"]["PositiveInteger"];
            /** @description Whether a file can carry text with it. */
            caption: boolean;
        };
        /** @description A room's own features where they differ from the declaration. A key replaces the declared value of that feature for this room, and `false` means the feature is unsupported here; an absent key leaves the declaration as it is. Only declared features appear: a room narrows the declaration and never adds to it. */
        RoomFeatures: {
            "rooms.list"?: false | components["schemas"]["FeatureRoomsList"];
            "messages.read"?: false | components["schemas"]["FeatureMessagesRead"];
            "messages.stream"?: false | components["schemas"]["FeatureMessagesStream"];
            "messages.send"?: false | components["schemas"]["FeatureMessagesSend"];
            "messages.reply"?: false | components["schemas"]["FeatureMessagesReply"];
            "messages.edit"?: false | components["schemas"]["FeatureMessagesEdit"];
            "messages.delete"?: false | components["schemas"]["FeatureMessagesDelete"];
            "reactions.read"?: false | components["schemas"]["FeatureReactionsRead"];
            "reactions.send"?: false | components["schemas"]["FeatureReactionsSend"];
            "read.mark"?: false | components["schemas"]["FeatureReadMark"];
            "typing.send"?: false | components["schemas"]["FeatureTypingSend"];
            "threads.read"?: false | components["schemas"]["FeatureThreadsRead"];
            "attachments.read"?: false | components["schemas"]["FeatureAttachmentsRead"];
            "attachments.send"?: false | components["schemas"]["FeatureAttachmentsSend"];
        } & {
            [key: string]: false | Record<string, never>;
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
            features?: components["schemas"]["RoomFeatures"];
        };
        RoomsAnswer: {
            /** @constant */
            ok: true;
            rooms: components["schemas"]["Room"][];
            /** @description `false` when the adapter stopped at its own cap and more rooms exist. */
            complete: boolean;
        };
        /** @description A file a message carries. A key that does not apply, or that the messenger does not say, is absent. */
        Attachment: {
            /** @description Opaque; `GET /media?id=` answers its bytes. */
            id: string;
            /** @description `file`: something to download. `image`: a still picture. `video`. `audio`: music or a recording. `voice`: a voice note. `sticker`. `animation`: a looping silent clip, such as a GIF. */
            kind: string;
            /** @description The file name it was sent with. Somebody else chose it: show it, never use it as a path. */
            name?: string;
            /** @description As the messenger reports it. `GET /media` serves a type by its own rule, not by this. */
            mimeType?: string;
            /** @description In bytes. */
            size?: number;
            /** @description In pixels. */
            width?: components["schemas"]["PositiveInteger"];
            /** @description In pixels. */
            height?: components["schemas"]["PositiveInteger"];
            durationSeconds?: number;
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
            /** @description `media`: a photo, file, sticker, voice and so on, with `text` its caption; its files are in `attachments` when the adapter declares `attachments.read`. A link preview is not media. `service`: a join, a title change and the like. */
            kind: string;
            /** Format: date-time */
            sentAt: string;
            /** Format: date-time */
            editedAt?: string;
            fromMe: boolean;
            /** @description The id of the message this replies to. */
            replyTo?: string;
            /** @description The files the message carries, in the order the messenger shows them. Present only when the adapter declares `attachments.read` and the message carries a file it can describe. */
            attachments?: components["schemas"]["Attachment"][];
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
    responses: {
        /** @description `INVALID_REQUEST`: malformed, or outside a declared limit; nothing changed. */
        InvalidRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description `UNAUTHORIZED`: missing or wrong bearer token. */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description `FORBIDDEN`: the messenger does not let this account do this here; nothing changed. */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description `NOT_FOUND`: no such room, message or attachment for this account. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description `RATE_LIMITED`: the adapter's line is full or the messenger asked it to slow down; nothing changed. */
        RateLimited: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description `INTERNAL`: the adapter failed; the message says nothing about the account. On a write, the outcome is unknown. */
        Internal: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description `NOT_SUPPORTED`: this adapter does not declare the route's feature. */
        NotSupported: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description `REAUTH_REQUIRED`: the messenger no longer accepts the adapter's session; nothing changed. */
        ReauthRequired: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
    };
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
            401: components["responses"]["Unauthorized"];
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
            401: components["responses"]["Unauthorized"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["Internal"];
            501: components["responses"]["NotSupported"];
            503: components["responses"]["ReauthRequired"];
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
            400: components["responses"]["InvalidRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["Internal"];
            501: components["responses"]["NotSupported"];
            503: components["responses"]["ReauthRequired"];
        };
    };
    media: {
        parameters: {
            query: {
                id: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The file, streamed. */
            200: {
                headers: {
                    /** @description The attachment's type when it is on the inline list above; otherwise `application/octet-stream`. */
                    "Content-Type"?: string;
                    /** @description `inline` or `attachment`, with the name, when there is one, in `filename*` (UTF-8, percent-encoded) beside a printable-ASCII `filename`. Somebody else chose the name: it is only ever a download name. */
                    "Content-Disposition"?: string;
                    /** @description `default-src 'none'; sandbox`. */
                    "Content-Security-Policy"?: string;
                    /** @description `nosniff`. */
                    "X-Content-Type-Options"?: string;
                    /** @description `private, max-age=86400`. */
                    "Cache-Control"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            400: components["responses"]["InvalidRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["Internal"];
            501: components["responses"]["NotSupported"];
            503: components["responses"]["ReauthRequired"];
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
            400: components["responses"]["InvalidRequest"];
            401: components["responses"]["Unauthorized"];
            501: components["responses"]["NotSupported"];
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
            400: components["responses"]["InvalidRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["RateLimited"];
            500: components["responses"]["Internal"];
            501: components["responses"]["NotSupported"];
            503: components["responses"]["ReauthRequired"];
        };
    };
}
