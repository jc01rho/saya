// Generated from contracts/piratetalk-extension.openapi.json by bun run extension:generate. Do not edit.
export interface paths {
    "/extensions/piratetalk/v1/stored-sticker-resource": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Resolve only the retained native type20 attachment path for this room and message. Fixed resource origin, no caller URL or filesystem path. Independent of send readiness. */
        get: operations["storedStickerResource"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["capabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/thread": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["thread"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["attachments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["members"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/friends": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["friends"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["profile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/stickers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["stickers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/sticker-resource": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["stickerResource"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/send": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["send"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["upload"];
        delete: operations["cancelUpload"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/reaction": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reaction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["read"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["summary"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/extensions/piratetalk/v1/question": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["question"];
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
        StoredStickerResourceRequest: {
            roomId: components["schemas"]["RoomId"];
            messageId: components["schemas"]["Id"];
        };
        /** @description Positive signed 64-bit decimal identity, maximum 9223372036854775807, no leading zero. Range enforced by this schema. */
        Id: string;
        /** @description Nonzero signed 64-bit decimal room identity, without leading zero or plus; range enforced by this schema. */
        RoomId: string;
        /** @description Opaque account/room/filter/snapshot-bound scan cursor; invalid or mismatched cursor is 400. Advance on scanned messages even when items is empty. */
        Cursor: string;
        Coverage: {
            /** @enum {string} */
            source: "live" | "archive" | "live+archive" | "cache";
            complete: boolean;
            stale: boolean;
            reason?: string;
        };
        Error: {
            code: string;
            detail: string;
        };
        ErrorResponse: {
            /** @constant */
            ok: false;
            error: components["schemas"]["Error"];
        };
        Feature: {
            available: boolean;
            reason?: string;
        };
        CapabilitiesRequest: Record<string, never>;
        CapabilitiesResponse: {
            /** @constant */
            version: "1.0.0";
            features: {
                reply: components["schemas"]["Feature"];
                thread: components["schemas"]["Feature"];
                mentions: components["schemas"]["Feature"];
                media: components["schemas"]["Feature"];
                stickers: components["schemas"]["Feature"];
                storedStickers?: components["schemas"]["Feature"];
                reactions: components["schemas"]["Feature"];
                history: components["schemas"]["Feature"];
                search: components["schemas"]["Feature"];
                readLocal: components["schemas"]["Feature"];
                people: components["schemas"]["Feature"];
                summary: components["schemas"]["Feature"];
                question: components["schemas"]["Feature"];
            };
            models: string[];
            uploadPolicy: {
                /** @description No explicit byte cap exists in the retained native uploader. Null means no declared byte ceiling, not native acceptance or operational readiness. */
                maxBytes: null;
                /** @constant */
                maxFiles: 1;
                kinds: ("photo" | "video" | "file")[];
            };
        };
        Mention: {
            userId: components["schemas"]["Id"];
            start: number;
            length: number;
        };
        /** @description Mention start/length are UTF-16 code units in text, must be in bounds at scalar boundaries, nonoverlapping, and server checks membership before converting native offsets. */
        TextSend: {
            roomId: components["schemas"]["RoomId"];
            /** @constant */
            kind: "text";
            text: string;
            replyTo?: components["schemas"]["Id"];
            threadRoot?: components["schemas"]["Id"];
            mentions?: components["schemas"]["Mention"][];
            mentionEveryone?: boolean;
        };
        MediaSend: {
            roomId: components["schemas"]["RoomId"];
            /** @constant */
            kind: "media";
            uploadId: string;
        };
        /** @description Catalog pack item code plus one-based sticker index, separated by colon; not a pack list position. */
        StickerId: string;
        StickerSend: {
            roomId: components["schemas"]["RoomId"];
            /** @constant */
            kind: "sticker";
            itemId: components["schemas"]["StickerId"];
        };
        SendRequest: components["schemas"]["TextSend"] | components["schemas"]["MediaSend"] | components["schemas"]["StickerSend"];
        /** @description Only attributable native readback; never inferred from ret 0x1 or HTTP acceptance. */
        Confirmed: {
            /** @constant */
            outcome: "confirmed";
            messageId: components["schemas"]["Id"];
        };
        Unconfirmed: {
            /** @constant */
            outcome: "unconfirmed";
            messageId?: components["schemas"]["Id"];
            error: components["schemas"]["Error"];
        };
        Rejected: {
            /** @constant */
            outcome: "rejected";
            error: components["schemas"]["Error"];
        };
        /** @description Do not automatically retry once bytes may have been sent; retain draft/pending state. Unknown error code remains an error. */
        MutationResponse: components["schemas"]["Confirmed"] | components["schemas"]["Unconfirmed"] | components["schemas"]["Rejected"];
        ReactionRequest: {
            roomId: components["schemas"]["RoomId"];
            messageId: components["schemas"]["Id"];
            code: string;
            selected: boolean;
        };
        ReadRequest: {
            roomId: components["schemas"]["RoomId"];
            messageId: components["schemas"]["Id"];
        };
        /** @description Durable local overlay only; no recipient receipt and no native activation. Rejected/unconfirmed use MutationResponse error branches. */
        ReadResponse: {
            /** @constant */
            outcome: "confirmed";
            /** @constant */
            scope: "local";
            roomId: components["schemas"]["RoomId"];
            messageId: components["schemas"]["Id"];
        };
        /** @description Inclusive Unix seconds, not milliseconds. Retained i64 validators have no fixed duration maximum; wire values restricted to JS safe integers. from <= to. No row cap may silently truncate a selected period. */
        UnixSeconds: number;
        SummaryRequest: {
            roomId: components["schemas"]["RoomId"];
            from: components["schemas"]["UnixSeconds"];
            to: components["schemas"]["UnixSeconds"];
            /** @description Must match a model returned by authenticated discovery; validated against configured server allowlist. */
            model?: string;
        };
        QuestionRequest: {
            roomId: components["schemas"]["RoomId"];
            from: components["schemas"]["UnixSeconds"];
            to: components["schemas"]["UnixSeconds"];
            /** @description Must match a model returned by authenticated discovery; validated against configured server allowlist. */
            model?: string;
            question: string;
        };
        Citation: {
            messageId: components["schemas"]["Id"];
            userId: components["schemas"]["Id"];
            text: string;
            at: components["schemas"]["UnixSeconds"];
        };
        SummaryResponse: {
            roomId: components["schemas"]["RoomId"];
            from: components["schemas"]["UnixSeconds"];
            to: components["schemas"]["UnixSeconds"];
            model: string;
            summary: string;
            coverage: components["schemas"]["Coverage"];
            messageCount: number;
            chunkCount: number;
        };
        QuestionResponse: {
            roomId: components["schemas"]["RoomId"];
            from: components["schemas"]["UnixSeconds"];
            to: components["schemas"]["UnixSeconds"];
            model: string;
            answer: string;
            coverage: components["schemas"]["Coverage"];
            citations: components["schemas"]["Citation"][];
            matchCount: number;
            windowCount: number;
        };
        UploadRequest: {
            roomId: components["schemas"]["RoomId"];
            /**
             * Format: binary
             * @description One raw multipart file; retained uploader has no explicit byte ceiling. Bound streaming memory independently of total file length; no invented ingress size policy.
             */
            file: string;
        };
        /** @description Opaque account+room-bound single-file staging token, not native send or proof of upload delivery. Reject expired/wrong-room tokens before native IPC; release staged bytes on cancellation/expiry. Raster photo and video classifications follow retained extensions; other files are download-only, never executable inline content. */
        UploadResponse: {
            roomId: components["schemas"]["RoomId"];
            uploadId: string;
            /** @enum {string} */
            kind: "photo" | "video" | "file";
            /** @description Observed byte count represented losslessly on the wire, not an upload acceptance ceiling. */
            size: number;
            mimeType: string;
            expiresAt: components["schemas"]["UnixSeconds"];
        };
        /** @description messageId loads context around exact anchor. beforeId, messageId and cursor are mutually exclusive. */
        HistoryRequest: {
            roomId: components["schemas"]["RoomId"];
            beforeId?: components["schemas"]["Id"];
            messageId?: components["schemas"]["Id"];
            /** @default 50 */
            limit: number;
            cursor?: components["schemas"]["Cursor"];
        };
        SearchRequest: {
            roomId?: components["schemas"]["RoomId"];
            q: string;
            /** @enum {string} */
            scope?: "messages" | "names";
            /** @default 50 */
            limit: number;
            cursor?: components["schemas"]["Cursor"];
        };
        ThreadRequest: {
            roomId: components["schemas"]["RoomId"];
            messageId: components["schemas"]["Id"];
            /** @default 50 */
            limit: number;
            cursor?: components["schemas"]["Cursor"];
        };
        AttachmentsRequest: {
            roomId: components["schemas"]["RoomId"];
            /** @enum {string} */
            kind?: "photo" | "video" | "file" | "link";
            /** @default 50 */
            limit: number;
            cursor?: components["schemas"]["Cursor"];
        };
        MembersRequest: {
            roomId: components["schemas"]["RoomId"];
        };
        FriendsRequest: {
            /** @default 50 */
            limit: number;
            cursor?: components["schemas"]["Cursor"];
            /** @enum {string} */
            section?: "all" | "favorites" | "updated" | "channels" | "birthday" | "hidden" | "blocked";
        };
        ProfileRequest: {
            userId: components["schemas"]["Id"];
        };
        StickersRequest: {
            /** @default 50 */
            limit: number;
            cursor?: components["schemas"]["Cursor"];
        };
        StickerResourceRequest: {
            itemId: components["schemas"]["StickerId"];
        };
        Message: {
            id: components["schemas"]["Id"];
            roomId: components["schemas"]["RoomId"];
            userId: components["schemas"]["Id"];
            text: string;
            /** @enum {string} */
            kind: "text" | "photo" | "video" | "file" | "sticker" | "other";
            at: components["schemas"]["UnixSeconds"];
            replyTo?: components["schemas"]["Id"];
            threadRoot?: components["schemas"]["Id"];
        };
        SearchHit: {
            roomId: components["schemas"]["RoomId"];
            messageId: components["schemas"]["Id"];
            userId: components["schemas"]["Id"];
            text: string;
            at: components["schemas"]["UnixSeconds"];
            /** @enum {string} */
            scope: "messages" | "names";
        };
        Attachment: {
            id: string;
            messageId: components["schemas"]["Id"];
            roomId: components["schemas"]["RoomId"];
            /** @enum {string} */
            kind: "photo" | "video" | "file" | "link";
            name: string;
            mimeType?: string;
            size?: number;
        };
        Person: {
            userId: components["schemas"]["Id"];
            name: string;
            status?: string;
            image?: components["schemas"]["CoreResourcePath"];
            background?: components["schemas"]["CoreResourcePath"];
            birthday?: string;
            sections?: ("favorites" | "updated" | "channels" | "birthday" | "hidden" | "blocked")[];
            roomId?: components["schemas"]["RoomId"];
            /** @description Retained Profile.musics serialized metadata string, preserved verbatim rather than inventing a track DTO; null when source is absent, blank or [] as in routes::get_user_profile. Not executable content or a resource URL. */
            musics?: string | null;
            /** @description Retained profile background colorCode metadata, not a URL. */
            backgroundColor?: string | null;
            /** @description Retained profile lastUpdatedAt timestamp when available. */
            lastUpdatedAt?: components["schemas"]["UnixSeconds"] | null;
        };
        Sticker: {
            itemId: components["schemas"]["StickerId"];
            name: string;
            resource: string;
        };
        HistoryResponse: {
            items: components["schemas"]["Message"][];
            hasMore: boolean;
            nextCursor: components["schemas"]["Cursor"] | null;
            coverage: components["schemas"]["Coverage"];
        };
        SearchResponse: {
            items: components["schemas"]["SearchHit"][];
            hasMore: boolean;
            nextCursor: components["schemas"]["Cursor"] | null;
            coverage: components["schemas"]["Coverage"];
        };
        ThreadResponse: {
            items: components["schemas"]["Message"][];
            hasMore: boolean;
            nextCursor: components["schemas"]["Cursor"] | null;
            coverage: components["schemas"]["Coverage"];
        };
        AttachmentsResponse: {
            items: components["schemas"]["Attachment"][];
            hasMore: boolean;
            nextCursor: components["schemas"]["Cursor"] | null;
            coverage: components["schemas"]["Coverage"];
        };
        FriendsResponse: {
            items: components["schemas"]["Person"][];
            hasMore: boolean;
            nextCursor: components["schemas"]["Cursor"] | null;
            coverage: components["schemas"]["Coverage"];
        };
        StickersResponse: {
            items: components["schemas"]["Sticker"][];
            hasMore: boolean;
            nextCursor: components["schemas"]["Cursor"] | null;
            coverage: components["schemas"]["Coverage"];
        };
        MembersResponse: {
            items: components["schemas"]["Person"][];
            coverage: components["schemas"]["Coverage"];
        };
        ProfileResponse: {
            profile: components["schemas"]["Person"] | null;
            coverage: components["schemas"]["Coverage"];
        };
        /**
         * Format: binary
         * @description Binary raster bytes with image/png, image/gif, image/webp or image/jpeg. No arbitrary external URL. A missing resource is a JSON error, never an empty successful image.
         */
        StickerResourceResponse: string;
        /** @description Root-relative same-origin core resource path. Backslashes, ASCII whitespace/control characters and network-path references are forbidden so WHATWG URL normalization cannot change the origin. */
        CoreResourcePath: string;
        CancelUploadRequest: {
            roomId: components["schemas"]["RoomId"];
            uploadId: string;
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
    storedStickerResource: {
        parameters: {
            query: {
                roomId: components["schemas"]["RoomId"];
                messageId: components["schemas"]["Id"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": components["schemas"]["StickerResourceResponse"];
                    "image/gif": components["schemas"]["StickerResourceResponse"];
                    "image/webp": components["schemas"]["StickerResourceResponse"];
                    "image/jpeg": components["schemas"]["StickerResourceResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
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
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CapabilitiesResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    history: {
        parameters: {
            query: {
                roomId: components["schemas"]["RoomId"];
                beforeId?: components["schemas"]["Id"];
                messageId?: components["schemas"]["Id"];
                limit?: number;
                cursor?: components["schemas"]["Cursor"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HistoryResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    search: {
        parameters: {
            query: {
                roomId?: components["schemas"]["RoomId"];
                q: string;
                scope?: "messages" | "names";
                limit?: number;
                cursor?: components["schemas"]["Cursor"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SearchResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    thread: {
        parameters: {
            query: {
                roomId: components["schemas"]["RoomId"];
                messageId: components["schemas"]["Id"];
                limit?: number;
                cursor?: components["schemas"]["Cursor"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ThreadResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    attachments: {
        parameters: {
            query: {
                roomId: components["schemas"]["RoomId"];
                kind?: "photo" | "video" | "file" | "link";
                limit?: number;
                cursor?: components["schemas"]["Cursor"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttachmentsResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    members: {
        parameters: {
            query: {
                roomId: components["schemas"]["RoomId"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembersResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    friends: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: components["schemas"]["Cursor"];
                section?: "all" | "favorites" | "updated" | "channels" | "birthday" | "hidden" | "blocked";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FriendsResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    profile: {
        parameters: {
            query: {
                userId: components["schemas"]["Id"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    stickers: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: components["schemas"]["Cursor"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StickersResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    stickerResource: {
        parameters: {
            query: {
                itemId: components["schemas"]["StickerId"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "image/png": components["schemas"]["StickerResourceResponse"];
                    "image/gif": components["schemas"]["StickerResourceResponse"];
                    "image/webp": components["schemas"]["StickerResourceResponse"];
                    "image/jpeg": components["schemas"]["StickerResourceResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
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
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unconfirmed or rejected mutation; no automatic replay. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unconfirmed"] | components["schemas"]["Rejected"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    upload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["UploadRequest"];
            };
        };
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UploadResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    cancelUpload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancelUploadRequest"];
            };
        };
        responses: {
            /** @description Staged upload cancelled and bytes released. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reaction: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReactionRequest"];
            };
        };
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unconfirmed or rejected mutation; no automatic replay. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unconfirmed"] | components["schemas"]["Rejected"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    read: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReadRequest"];
            };
        };
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unconfirmed or rejected mutation; no automatic replay. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unconfirmed"] | components["schemas"]["Rejected"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    summary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SummaryRequest"];
            };
        };
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SummaryResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    question: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuestionRequest"];
            };
        };
        responses: {
            /** @description Validated result; coverage is local source coverage, never global conversation completeness. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QuestionResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            415: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Explicit failure; missing data is not an empty successful result. Sanitized machine code and detail. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
