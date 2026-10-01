// Generated from openapi.json by bun run contract:generate. Do not edit.
export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Whether the server is up
         * @description Deliberately unauthenticated: a probe that needs the secret cannot tell a wrong token from a dead process.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The server is answering. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "ok": true
                         *     }
                         */
                        "application/json": {
                            /** @constant */
                            ok: true;
                        };
                    };
                };
            };
        };
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
         * List the conversations the catalog knows
         * @description Every room in the client's catalog, most recently active first — including the ones whose messages cannot be read, which say so through `readable` rather than being hidden.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The catalog. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @constant */
                            ok: true;
                            rooms: components["schemas"]["Room"][];
                        };
                    };
                };
                401: components["responses"]["Unauthorized"];
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * One room's recent messages, with what they say about attention
         * @description The single call an agent makes to catch up on a conversation: the room, a window of messages oldest-first, who was addressed, and how far the local copy reaches.
         */
        get: {
            parameters: {
                query: {
                    /**
                     * @description The room's identifier, as a string. Ids exceed 2^53, so they cross this boundary as text; a value outside the 64-bit range is a 400 rather than an overflow out of the database driver.
                     * @example 18491246151592761
                     */
                    roomId: components["parameters"]["RoomId"];
                    /** @description Open the room in the client first if its key is not in memory, then answer. Opening a room marks it read in the client, so it happens only when asked; without it such a room answers 503 `KEY_UNAVAILABLE`. `true` or `false` — anything else is a 400, so a typo cannot open a room. Opening is done one at a time, under the same lock as sending. On a host where every room is always readable it changes nothing. */
                    open?: components["parameters"]["OpenRoom"];
                    /** @description How many of the newest messages to return. Bounded because `limit` reaches SQLite, where a negative number means *no limit at all* and one observed room holds 445,714 messages. */
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The window. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Context"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Ambiguous"];
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/digest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The same window, extracted rather than quoted whole
         * @description Counts, participants, keywords and representative lines per time slice. Nothing is invented and nothing is summarised by a model: a highlight is a message that was really sent, id and all. Measured on one live room, the same newest 400 messages were 116,269 bytes through `/context` and 3,989 through `/digest` — over a link, that gap is the point.
         */
        get: {
            parameters: {
                query: {
                    /**
                     * @description The room's identifier, as a string. Ids exceed 2^53, so they cross this boundary as text; a value outside the 64-bit range is a 400 rather than an overflow out of the database driver.
                     * @example 18491246151592761
                     */
                    roomId: components["parameters"]["RoomId"];
                    /** @description Open the room in the client first if its key is not in memory, then answer. Opening a room marks it read in the client, so it happens only when asked; without it such a room answers 503 `KEY_UNAVAILABLE`. `true` or `false` — anything else is a 400, so a typo cannot open a room. Opening is done one at a time, under the same lock as sending. On a host where every room is always readable it changes nothing. */
                    open?: components["parameters"]["OpenRoom"];
                    /** @description How long a slice covers, as a duration such as `30m`, `2h` or `1d`. A span the slicer cannot take is a 400. */
                    span?: string;
                    /** @description How many of the newest messages to consider before slicing. */
                    limit?: number;
                    /** @description Representative lines per slice. */
                    highlights?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The digest. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Digest"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Ambiguous"];
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notice": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The notice pinned in a room
         * @description Read from the catalog, so it needs no room key and never opens a room. `notice` is null when the room has none. The macOS database has no board table, so its notice is always `source: legacy`.
         */
        get: {
            parameters: {
                query: {
                    /**
                     * @description The room's identifier, as a string. Ids exceed 2^53, so they cross this boundary as text; a value outside the 64-bit range is a 400 rather than an overflow out of the database driver.
                     * @example 18491246151592761
                     */
                    roomId: components["parameters"]["RoomId"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The notice, or null. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["NoticeAnswer"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The photos, videos, files and links a room's messages carried
         * @description Looks through the newest `limit` messages and lists what they carried, oldest first. A covered message offers no links while it stays covered.
         */
        get: {
            parameters: {
                query: {
                    /**
                     * @description The room's identifier, as a string. Ids exceed 2^53, so they cross this boundary as text; a value outside the 64-bit range is a 400 rather than an overflow out of the database driver.
                     * @example 18491246151592761
                     */
                    roomId: components["parameters"]["RoomId"];
                    /** @description Open the room in the client first if its key is not in memory, then answer. Opening a room marks it read in the client, so it happens only when asked; without it such a room answers 503 `KEY_UNAVAILABLE`. `true` or `false` — anything else is a 400, so a typo cannot open a room. Opening is done one at a time, under the same lock as sending. On a host where every room is always readable it changes nothing. */
                    open?: components["parameters"]["OpenRoom"];
                    kind?: "photo" | "video" | "file" | "link";
                    /** @description How many of the newest messages to look through. */
                    limit?: number;
                    /** @description Page backwards from this message id. */
                    beforeId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description What the messages carried. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Attachments"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/revisions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Every version of an edited message
         * @description Asked only of a message that is still there: one deleted for everyone keeps its history, and reading it back would undo the deletion, so that is `MESSAGE_NOT_FOUND`. The macOS client keeps no earlier versions at all, so there an edited message answers with an empty list.
         */
        get: {
            parameters: {
                query: {
                    /**
                     * @description The room's identifier, as a string. Ids exceed 2^53, so they cross this boundary as text; a value outside the 64-bit range is a 400 rather than an overflow out of the database driver.
                     * @example 18491246151592761
                     */
                    roomId: components["parameters"]["RoomId"];
                    /** @description Open the room in the client first if its key is not in memory, then answer. Opening a room marks it read in the client, so it happens only when asked; without it such a room answers 503 `KEY_UNAVAILABLE`. `true` or `false` — anything else is a 400, so a typo cannot open a room. Opening is done one at a time, under the same lock as sending. On a host where every room is always readable it changes nothing. */
                    open?: components["parameters"]["OpenRoom"];
                    /** @description The message's id, as a string of digits. */
                    messageId: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The versions, oldest first. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Revisions"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * A file message's bytes
         * @description The copy the client saved when one is still there at the recorded size — on Windows looked for by name in `Documents\카카오톡 받은 파일`, on macOS at the path the client recorded for the save; otherwise fetched from the address, and only from the client's own hosts. An expired address is `410 FILE_EXPIRED` without a request being made.
         */
        get: {
            parameters: {
                query: {
                    /**
                     * @description The room's identifier, as a string. Ids exceed 2^53, so they cross this boundary as text; a value outside the 64-bit range is a 400 rather than an overflow out of the database driver.
                     * @example 18491246151592761
                     */
                    roomId: components["parameters"]["RoomId"];
                    /** @description Open the room in the client first if its key is not in memory, then answer. Opening a room marks it read in the client, so it happens only when asked; without it such a room answers 503 `KEY_UNAVAILABLE`. `true` or `false` — anything else is a 400, so a typo cannot open a room. Opening is done one at a time, under the same lock as sending. On a host where every room is always readable it changes nothing. */
                    open?: components["parameters"]["OpenRoom"];
                    /** @description The message's id, as a string of digits. */
                    messageId: string;
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
                        /** @description `attachment`, with the name in `filename*` (UTF-8, percent-encoded) and a printable-ASCII fallback in `filename`. */
                        "Content-Disposition"?: string;
                        /** @description `local` for the client's saved copy, `remote` for the address. */
                        "X-Kanao-Source"?: "local" | "remote";
                        [name: string]: unknown;
                    };
                    content: {
                        "application/octet-stream": string;
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                /** @description The file's address has expired and no saved copy was found. */
                410: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
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
         * New messages as they arrive, as Server-Sent Events
         * @description Holds the connection open and emits an event per poll. SSE rather than WebSockets because this is a one-way push of small JSON payloads: `curl -N` is a complete client and neither side needs a dependency.
         *
         *     **Resuming is by cursor, not by `Last-Event-ID`.** The stream covers every readable room, so the newest message says nothing about where the *other* rooms had reached — one id resuming all of them would silently skip. After the messages it covers, the server emits `event: cursor` carrying `{roomId: logId}`; hand that back as repeated `since=<roomId>:<logId>` and each named room is paged forward from there before going live. A room the cursor does not name starts from the moment of connection: that is a gap, and it is documented rather than papered over. Fill it with `/context` if it matters.
         *
         *     At most `MAX_STREAMS` (8) connections may be open at once, because each one owns a reader and a watcher for its whole life; the ninth is refused with `503 BUSY` so the eight keep working.
         */
        get: {
            parameters: {
                query?: {
                    /**
                     * @description Where to resume each room, as `roomId:logId`. Repeat the parameter once per room.
                     * @example [
                     *       "1001:5300",
                     *       "1002:412"
                     *     ]
                     */
                    since?: string[];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The stream. Events are `ready`, `message`, `cursor`, `ping` and `error`; `error` is always last, because the status line is long gone by the time a poll fails. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example event: ready
                         *     data: {"ok": true, "resumed": false, "cursor": {}}
                         *
                         *     event: message
                         *     data: {"ok": true, "message": {"id": "5301", "roomId": "1001", "senderId": "42", "sender": "Peer", "text": "hi", "kind": "text", "sentAt": "2026-09-18T00:21:30+00:00", "fromMe": false}}
                         *
                         *     event: cursor
                         *     data: {"ok": true, "cursor": {"1001": "5301"}}
                         *
                         *     event: ping
                         *     data: {"ok": true}
                         */
                        "text/event-stream": string;
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
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
        /**
         * Not allowed
         * @description `PUT`, `DELETE` and `PATCH` are answered `405` once the token checks out.
         */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                401: components["responses"]["Unauthorized"];
                405: components["responses"]["MethodNotAllowed"];
            };
        };
        /**
         * Put text in the client's own input box and press Enter
         * @description The one write in this API. It drives the desktop client rather than any protocol: the room must resolve to exactly one catalog entry, and the client must have that conversation in a window (`openRoom` lets the server open it).
         *
         *     **Sends are serialized and paced.** One lock, and a minimum interval between two of them, because the composer is a single shared resource. A send that arrives early **waits its turn and then goes** — it is not refused. `429 RATE_LIMITED` means the queue itself is full (`MAX_QUEUED_SENDS`, 4, counting the one being sent), which is the only case where refusing is better than a queue that never ends.
         *
         *     **`submitted: true` is queue acceptance, not delivery.** A caller that needs proof reads the room back and looks for a new `fromMe` message. Never retry an uncertain send automatically: the client may have sent it already.
         */
        post: {
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
                /** @description The client accepted the text (or, for a dry run, would have). */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SendResult"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                /** @description The caller promised a body in `Content-Length` and then went quiet. The connection is given up on after `--request-timeout` seconds (30 by default) rather than holding a thread for as long as the caller likes. */
                408: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                409: components["responses"]["Ambiguous"];
                /** @description The send queue is full. Retry once the sends already in line have gone through. */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "ok": false,
                         *       "error": {
                         *         "code": "RATE_LIMITED",
                         *         "message": "the send queue is full (4 already in line); retry once they have gone through"
                         *       }
                         *     }
                         */
                        "application/json": components["schemas"]["ErrorEnvelope"];
                    };
                };
                500: components["responses"]["ServerFailure"];
                503: components["responses"]["NotReady"];
            };
        };
        /** Not allowed */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                401: components["responses"]["Unauthorized"];
                405: components["responses"]["MethodNotAllowed"];
            };
        };
        options?: never;
        head?: never;
        /** Not allowed */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                401: components["responses"]["Unauthorized"];
                405: components["responses"]["MethodNotAllowed"];
            };
        };
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description What went wrong, as something a program can branch on. A consumer must have a default branch: the two builds' sets are not identical and both may grow. */
        ErrorCode: string;
        ErrorEnvelope: {
            /** @constant */
            ok: false;
            error: {
                code: components["schemas"]["ErrorCode"];
                /** @description For a person reading a log. Do not branch on it; branch on `code`. */
                message: string;
            };
            /** @description Attached to `AMBIGUOUS_CHAT`: the rooms that matched, so the caller can choose rather than being guessed at. */
            candidates?: components["schemas"]["Room"][];
        };
        /** @description One conversation as the client's catalog describes it. */
        Room: {
            /** @description Carried as a string: ids exceed 2^53. */
            id: string;
            /** @description What this reader composes for the room, which is not always what the client's window is titled. */
            title: string;
            /** @description A stable name an agent can branch on. Every client type either build has seen maps to one of these. `channel` (the client's `PlusChat`) comes from the Windows build only: the macOS build decides a room's kind from its shape and has no channel room to name. A type neither build has seen would be passed through as the client's own word, the same string as `type`, so branch with a default rather than rejecting the room. Until 0.19.0 this listed `open`, `plus` and `unknown`, which neither build ever sent, and left out `channel`, `open-group` and `open-direct`, which they do. */
            kind: string;
            /**
             * @description The client's own word for it, passed through.
             * @example DirectChat
             * @example MultiChat
             * @example MemoChat
             * @example PlusChat
             * @example OM
             * @example OD
             */
            type: string;
            memberCount: number;
            unread: number;
            lastMessageId: string | null;
            /**
             * Format: date-time
             * @description An explicit UTC instant.
             */
            lastActivityAt: string | null;
            /** @description Whether this room's messages can be decrypted right now. A room the client has never opened has no key in memory, and is listed rather than hidden. */
            readable: boolean;
            /** @description The client's own integer type, passed through without interpretation. */
            typeCode?: number;
            /** @description Present only when the room has a picture to draw: the pictures its icon is made of, best first. A room with a photo of its own — one a member set, or an open group chat's link picture — is that photo alone. Otherwise a room with one counterpart (1:1, open 1:1, channel) is that counterpart's profile picture, the chat with oneself is the account's own, and any other room is up to four of its active members other than the account, in the catalog's order. A chat background is not a room's picture. Addresses are HTTPS on the client's CDN (`*.kakaocdn.net`); the cores fetch nothing for them. */
            images?: string[];
        };
        /** @description One @name, kept as the account it points at rather than as the name. The text carries only a name, and anyone can wear a name; the id is the mention. */
        Mention: {
            userId: string;
            /** @description Who that id is *now*, or null when this profile has never seen them. */
            name: string | null;
            /** @description Where the name sits in the message text, as the client recorded it. */
            at: number[];
            length: number;
        };
        /** @description The message a reply was written against, as the reply itself recorded it. This is the client's own copy taken when the reply was sent, so it survives the original being deleted and may disagree with what the original row says now. */
        ReplySource: {
            messageId: string | null;
            senderId: string | null;
            sender: string | null;
            text: string | null;
            kind: string | null;
        };
        /** @description Where a picture lives and how large it was sent. Present only on a message that carries one. The client stores an address on its own CDN rather than the picture, so this is the address — the server fetches nothing; a browser can use `url` directly. An album carries its first picture as `url`, how many there are in `count`, and every one of them in `images`. The size is the one the client stored, which a rotated photo can disagree with. */
        Photo: {
            /** Format: uri */
            url: string;
            width: number;
            height: number;
            count: number;
            /** @description Every picture the message carried, in order: one for a single photo, one per picture for an album. `url`, `width` and `height` above repeat the first. A size the client did not store is 0. */
            images: components["schemas"]["PhotoImage"][];
        };
        /** @description Where a video lives and what the client stored about it. Present only on a video message. There is no thumbnail: across 3,814 videos on the two builds not one attachment carried a thumbnail address, so a viewer that wants a first frame asks the video for it. The address is on the client's CDN and the cores fetch nothing for it. A number the client did not store is 0. */
        Video: {
            /** Format: uri */
            url: string;
            width: number;
            height: number;
            /** @description Seconds. */
            duration: number;
            /** @description Bytes. */
            size: number;
            /**
             * Format: date-time
             * @description Present only when the client stored one: after it the address may no longer answer. Measured at 14 days after the message was sent.
             */
            expiresAt?: string;
        };
        /** @description One picture of a message: its address on the client's CDN and the size stored beside it. */
        PhotoImage: {
            /** Format: uri */
            url: string;
            width: number;
            height: number;
        };
        /**
         * @description One message, already attributed to a named sender.
         *
         *     **The name is the one that account carries now.** The client overwrites its profile tables in place, so a message sent under an old nickname is shown under the new one; `senderId` never changes and is the only safe way to say "same person".
         *
         *     The keys that report being addressed appear **only when they apply**. A window is forty of these, and denying five things per line would triple the answer.
         */
        Message: {
            id: string;
            roomId: string;
            senderId: string;
            sender: string;
            /** @description Empty for kinds that carry no text, such as `feed`, whose stored value is the client's own JSON bookkeeping and is deliberately dropped. */
            text: string;
            /**
             * @description The confirmed kinds are named; anything else is left self-describing.
             * @example text
             * @example photo
             * @example video
             * @example file
             * @example reply
             * @example feed
             */
            kind: string;
            /** Format: date-time */
            sentAt: string | null;
            fromMe: boolean;
            mentions?: components["schemas"]["Mention"][];
            /**
             * @description Present only when the message carried an @전체 rather than naming anybody.
             * @constant
             */
            mentionsAll?: true;
            /**
             * @description Present only when the signed-in account is one of the ids this message named.
             * @constant
             */
            mentionsMe?: true;
            replyTo?: components["schemas"]["ReplySource"];
            /** @constant */
            repliesToMe?: true;
            photo?: components["schemas"]["Photo"];
            video?: components["schemas"]["Video"];
            /** @description Present only when somebody reacted. Who reacted is not stored by the client, only how many chose each kind. */
            reactions?: components["schemas"]["Reaction"][];
            /**
             * @description Present only when the sender edited the message; `text` is the newest version and `/revisions` lists the others.
             * @constant
             */
            edited?: true;
            /**
             * @description Present when an open chat's SafeBot covered the message. Its `text` is empty, the way the client hides it, unless the caller asked for covered messages to be shown.
             * @enum {string}
             */
            covered?: "safebot";
            /**
             * Format: uri
             * @description Present only when the client holds a profile picture for the sender: the small one, HTTPS on the client's CDN (`*.kakaocdn.net`). Like `sender`, it is the picture that account carries now, not the one it had when the message was sent. The cores fetch nothing for it.
             */
            senderImage?: string;
        };
        /** @description The same facts the per-message keys carry, gathered once so a caller can ask "was I addressed" without walking the window. */
        Attention: {
            mentionsMe: string[];
            repliesToMe: string[];
            mentionsEveryone: string[];
        };
        /** @description How far the local copy reaches, so an empty answer is never mistaken for an empty conversation. */
        Coverage: {
            /**
             * @description Always true: this server reads what the client already stored and fetches nothing.
             * @constant
             */
            localOnly: true;
            reachesLatestKnown: boolean;
            catalogLatestMessageId: string | null;
            newestReadMessageId: string | null;
            hasEarlier: boolean;
            /** @description How many messages of this room are on this machine. One observed room held 445,714. */
            storedLocally: number;
        };
        Context: {
            /** @constant */
            ok: true;
            room: components["schemas"]["Room"];
            /** @description Oldest first, everywhere in this API. */
            messages: components["schemas"]["Message"][];
            lastMessageFromMe: boolean | null;
            attention: components["schemas"]["Attention"];
            coverage: components["schemas"]["Coverage"];
        };
        DigestSlice: {
            /** Format: date-time */
            from: string;
            /** Format: date-time */
            to: string;
            count: number;
            speakers: {
                name: string;
                count: number;
            }[];
            /** @description The client's placeholder words for attachments are filtered out, or they dominate every slice. */
            keywords: {
                word: string;
                count: number;
            }[];
            /** @description Real messages, id and all. Nothing here is generated. */
            highlights: components["schemas"]["Message"][];
        };
        Digest: {
            /** @constant */
            ok: true;
            room: components["schemas"]["Room"];
            span: string;
            /** @description How many messages the slicing looked at. */
            considered: number;
            slices: components["schemas"]["DigestSlice"][];
            /** @description Says in words that this is extractive: no model ran, and nothing was summarised. */
            note: string;
        };
        SendRequest: {
            /** @description The room's title, or its id as a string. Must resolve to exactly one catalog room; duplicates are refused with `AMBIGUOUS_CHAT` rather than guessed at. */
            room: string;
            /** @description What to type. Newlines are allowed. */
            text: string;
            /**
             * @description Resolve the room and the window, report what would happen, and type nothing. Skips the send queue entirely, so it costs no quota.
             * @default false
             */
            dryRun: boolean;
            /**
             * @description Let the server open the conversation if it has no window, and put the desktop back as it found it afterwards.
             * @default false
             */
            openRoom: boolean;
        };
        SendResult: {
            /** @constant */
            ok: true;
            /** @description The client accepted the text. **Queue acceptance, not delivery** — read the room back and look for a new `fromMe` message before claiming it arrived. */
            submitted: boolean;
            dryRun: boolean;
            /** @description The window title the text was given to. */
            room: string;
            roomId: string;
            /** @description Characters handed over. */
            length: number;
            /** @description An unfinished line was in the box and is now gone. Reported rather than refused, because losing somebody's half-typed sentence silently is the indefensible part. */
            clearedDraft?: boolean;
            /** @description The dry-run form of `clearedDraft`. */
            wouldClearDraft?: boolean;
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
        /**
         * @description Room id to the newest log id the stream has sent for it. Hand it back as repeated `since=<roomId>:<logId>`.
         * @example {
         *       "1001": "5301",
         *       "1002": "412"
         *     }
         */
        Cursor: {
            [key: string]: string;
        };
        /** @description One kind of 공감 on a message and how many people chose it. */
        Reaction: {
            /** @description The word the client shows, such as 사랑 or 엄지척. */
            label: string;
            count: number;
            /** @description The mini emoticon it is drawn with. */
            code?: string;
        };
        /** @description The notice pinned in a room. A board post wins over the older notice row, which in every room holding both was the older of the two. */
        Notice: {
            text: string;
            /**
             * @example text
             * @example image
             * @example schedule
             */
            kind: string;
            authorId: string | null;
            /** @description Who that id is now. */
            author: string | null;
            /** Format: date-time */
            postedAt: string | null;
            /** @enum {string} */
            source: "board" | "legacy";
            /**
             * @description Present only when `text` stopped at the 100 characters the client keeps of a board post; the rest of the post is not on this machine.
             * @constant
             */
            truncated?: true;
            /** @description Present only when `truncated` and exactly one live text or reply message in the room begins with the whole of `text`: that message's text, as the notice it was pinned from. The post records no message id, so this is **found by its words, not by an id**, and a caller should say so. Asked only of a room whose key is already in memory; `/notice` still never opens a room. */
            fullText?: string;
            /** @description The id of the message `fullText` was read from. Present exactly when `fullText` is. */
            fullTextMessageId?: string;
            /**
             * @description Present only beside `fullText`, when that message itself stopped at the 3,999 characters the client keeps of a long message. The rest is a file the client did not save and its CDN refuses without the client's own protocol, so `fullText` is all a core can read.
             * @constant
             */
            fullTextTruncated?: true;
            /** @description Present when two or more messages each begin with the whole of `text`: their ids, up to six, and **none is picked** — ambiguity is refused with its candidates. */
            fullTextCandidates?: string[];
        };
        NoticeAnswer: {
            /** @constant */
            ok: true;
            room: components["schemas"]["Room"];
            notice: components["schemas"]["Notice"] | null;
        };
        /** @description Something a message carried. An address, never the thing itself; a file's address stops answering once it expires, and `/file` fetches it. */
        Attachment: {
            messageId: string;
            /** @enum {string} */
            kind: "photo" | "video" | "file" | "link";
            senderId: string;
            sender: string;
            /** Format: date-time */
            sentAt: string | null;
            url: string;
            /** @description A file's name as it was sent; somebody else wrote it. */
            name?: string;
            /** @description Bytes, for a file or a video. */
            size?: number;
            /** @description Present on an album; `url` is its first picture. */
            count?: number;
            /** Format: date-time */
            expiresAt?: string;
        };
        Attachments: {
            /** @constant */
            ok: true;
            room: components["schemas"]["Room"];
            attachments: components["schemas"]["Attachment"][];
            count: number;
        };
        Revision: {
            /** @description 0 is the message as first sent. */
            revision: number;
            text: string;
            kind: string;
        };
        Revisions: {
            /** @constant */
            ok: true;
            room: components["schemas"]["Room"];
            messageId: string;
            /** @description Oldest first. Empty when the client kept no history for that message. */
            revisions: components["schemas"]["Revision"][];
            count: number;
        };
    };
    responses: {
        /** @description The bearer token was missing or wrong. */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "ok": false,
                 *       "error": {
                 *         "code": "UNAUTHORIZED",
                 *         "message": "missing or invalid token"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description The arguments were understood and unusable: a count outside its range, a non-numeric room id, a body that is not JSON, or a span the slicer cannot take. Refused before any database is opened. */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "ok": false,
                 *       "error": {
                 *         "code": "INVALID_REQUEST",
                 *         "message": "limit must be between 1 and 1000"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description Nothing by that name: no such route, no room with that title, no open window for it, or a window whose input box was not there (`CHAT_NOT_FOUND`, `WINDOW_NOT_FOUND`, `INPUT_NOT_FOUND`, `INVALID_REQUEST`). */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "ok": false,
                 *       "error": {
                 *         "code": "WINDOW_NOT_FOUND",
                 *         "message": "that room has no open chat window"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description Several rooms matched. The candidates are attached rather than one being picked. */
        Ambiguous: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "ok": false,
                 *       "error": {
                 *         "code": "AMBIGUOUS_CHAT",
                 *         "message": "multiple catalog rooms share this window title; give the target a unique title"
                 *       },
                 *       "candidates": [
                 *         {
                 *           "id": "1001",
                 *           "title": "가족",
                 *           "kind": "group",
                 *           "type": "MultiChat",
                 *           "memberCount": 4,
                 *           "unread": 0,
                 *           "lastMessageId": "5300",
                 *           "lastActivityAt": "2026-09-18T00:21:30+00:00",
                 *           "readable": true
                 *         }
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description The route exists and the method does not. */
        MethodNotAllowed: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "ok": false,
                 *       "error": {
                 *         "code": "INVALID_REQUEST",
                 *         "message": "method not allowed"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description The request was fine and this server could not carry it out: a database that would not decrypt or read (`READ_FAILED`), a send the client refused or that could not be verified (`SEND_FAILED`), or a stream asked to resume by a watcher that cannot. */
        ServerFailure: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "ok": false,
                 *       "error": {
                 *         "code": "READ_FAILED",
                 *         "message": "the catalog could not be read"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
        /** @description The machine is not in a state to answer: the client is closed (`KAKAO_NOT_RUNNING`), it has not opened that room this session so its key is not in memory (`KEY_UNAVAILABLE`; ask again with `open=true`), there is no signed-in profile (`NO_USER_DATA`), the server is shutting down or already holds as many streams as it will (`BUSY`), or — macOS only — the permissions it needs have not been granted (`PERMISSION_REQUIRED`). */
        NotReady: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "ok": false,
                 *       "error": {
                 *         "code": "KEY_UNAVAILABLE",
                 *         "message": "KakaoTalk has not opened that room this session"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
    };
    parameters: {
        /**
         * @description The room's identifier, as a string. Ids exceed 2^53, so they cross this boundary as text; a value outside the 64-bit range is a 400 rather than an overflow out of the database driver.
         * @example 18491246151592761
         */
        RoomId: string;
        /** @description Open the room in the client first if its key is not in memory, then answer. Opening a room marks it read in the client, so it happens only when asked; without it such a room answers 503 `KEY_UNAVAILABLE`. `true` or `false` — anything else is a 400, so a typo cannot open a room. Opening is done one at a time, under the same lock as sending. On a host where every room is always readable it changes nothing. */
        OpenRoom: boolean;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
