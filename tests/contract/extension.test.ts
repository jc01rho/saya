import { expect, test } from "bun:test";
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateExtension } from "../../src/contract/piratetalk/boundary";

const root = fileURLToPath(new URL("../../", import.meta.url));

async function sandbox(action: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "saya-extension-"));
  try {
    for (const path of ["scripts", "contracts", "src/contract", "package.json"])
      await cp(join(root, path), join(directory, path), { recursive: true });
    await symlink(join(root, "node_modules"), join(directory, "node_modules"));
    await action(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function check(directory: string, args: readonly string[] = []) {
  const process = Bun.spawn(
    [Bun.which("bun") ?? "bun", "run", "extension:check", ...args],
    {
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const [code, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  return { code, stdout, stderr };
}

test("preserves large identities and rejects overflow or numeric ids", () => {
  const input = {
    roomId: "-9223372036854775808",
    messageId: "9007199254740993",
  };
  expect(validateExtension("ReadRequest", input)).toBe(true);
  expect(
    validateExtension("ReadRequest", { ...input, messageId: 9007199254740992 }),
  ).toBe(false);
  expect(
    validateExtension("ReadRequest", {
      ...input,
      messageId: "9223372036854775808",
    }),
  ).toBe(false);
  expect(
    validateExtension("HistoryRequest", {
      roomId: "1001",
      beforeId: "9223372036854775808",
    }),
  ).toBe(false);
});

test("rejects resource normalization escapes while keeping local paths", () => {
  const person = { userId: "42", name: "Synthetic" };
  for (const field of ["image", "background"]) {
    expect(
      validateExtension("Person", {
        ...person,
        [field]: "/file?resource=synthetic",
      }),
    ).toBe(true);
    for (const path of [
      "/\\evil.example/x",
      "//evil.example/x",
      "/\t/evil.example/x",
      "/\n/evil.example/x",
      "/\r/evil.example/x",
      "/file\u0000x",
    ]) {
      expect(validateExtension("Person", { ...person, [field]: path })).toBe(
        false,
      );
    }
  }
  expect(new URL("/\\evil.example/x", "https://core.example").origin).toBe(
    "https://evil.example",
  );
});

test("accepts opaque numeric attachment ids but rejects message identity overflow", () => {
  const attachment = {
    id: "9223372036854775808",
    roomId: "9",
    messageId: "11",
    kind: "file",
    name: "x.txt",
  };
  expect(validateExtension("Attachment", attachment)).toBe(true);
  expect(
    validateExtension("AttachmentsResponse", {
      items: [attachment],
      hasMore: false,
      nextCursor: null,
      coverage: { source: "archive", complete: true, stale: false },
    }),
  ).toBe(true);
  expect(
    validateExtension("Attachment", {
      ...attachment,
      messageId: attachment.id,
    }),
  ).toBe(false);
  expect(
    validateExtension("Message", {
      id: attachment.id,
      roomId: "9",
      userId: "42",
      text: "Synthetic",
      kind: "text",
      at: 1700000000,
    }),
  ).toBe(false);
});

test("preserves retained nullable serialized music and profile metadata", () => {
  const profile = {
    userId: "42",
    name: "Synthetic",
    musics: '[{"title":"Synthetic track"}]',
    backgroundColor: "#112233",
    lastUpdatedAt: 1700000000,
  };
  const before = JSON.stringify(profile);
  expect(validateExtension("Person", profile)).toBe(true);
  expect(JSON.stringify(profile)).toBe(before);
  expect(
    validateExtension("Person", {
      ...profile,
      musics: null,
      backgroundColor: null,
      lastUpdatedAt: null,
    }),
  ).toBe(true);
  expect(validateExtension("Person", { ...profile, musics: 12 })).toBe(false);
});

test("accepts upload sizes above the removed invented ceiling", () => {
  const upload = {
    roomId: "9",
    uploadId: "abcdefghijklmnop",
    kind: "file",
    size: 67108865,
    mimeType: "application/octet-stream",
    expiresAt: 1791039999,
  };
  expect(validateExtension("UploadResponse", upload)).toBe(true);
  expect(validateExtension("UploadResponse", { ...upload, size: 0 })).toBe(
    false,
  );
});

test("rejects overlapping mentions while preserving valid input bytes", () => {
  const input = {
    roomId: "1001",
    kind: "text",
    text: "😀 peer",
    mentions: [{ userId: "42", start: 3, length: 4 }],
  };
  const before = JSON.stringify(input);
  expect(validateExtension("SendRequest", input)).toBe(true);
  expect(JSON.stringify(input)).toBe(before);
  expect(
    validateExtension("SendRequest", {
      ...input,
      mentions: [...input.mentions, { userId: "43", start: 4, length: 1 }],
    }),
  ).toBe(false);
});

test("rejects stale artifacts without rewriting dirty worktree files", async () => {
  await sandbox(async (directory) => {
    const path = join(directory, "src/contract/piratetalk/version.ts");
    const dirty = `${await readFile(path, "utf8")}\n// synthetic dirty edit\n`;
    await writeFile(path, dirty);
    const result = await check(directory);
    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(await readFile(path, "utf8")).toBe(dirty);
  });
}, 20000);

test("rejects unexpected generated artifacts", async () => {
  await sandbox(async (directory) => {
    await writeFile(
      join(directory, "src/contract/piratetalk/stale.js"),
      "export const stale = true;\n",
    );
    const result = await check(directory);
    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe("");
  });
}, 20000);

test("accepts the valid corpus through the actual CLI without changing dirty files", async () => {
  await sandbox(async (directory) => {
    const sentinel = join(directory, "unrelated-dirty.txt");
    await writeFile(sentinel, "synthetic unrelated work\n");
    const result = await check(directory);
    expect(result.code, result.stderr).toBe(0);
    expect(await readFile(sentinel, "utf8")).toBe("synthetic unrelated work\n");
  });
}, 20000);

test("rejects malformed standalone discriminants without success output", async () => {
  await sandbox(async (directory) => {
    const path = join(directory, "invalid.json");
    await writeFile(
      path,
      JSON.stringify({
        schema: "MutationResponse",
        data: { outcome: "success", messageId: "9007199254740993" },
      }),
    );
    const result = await check(directory, ["--fixture", path]);
    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe("");
  });
}, 20000);

test("rejects malformed JSON before any success output", async () => {
  await sandbox(async (directory) => {
    const path = join(directory, "invalid.json");
    await writeFile(path, "{broken");
    const result = await check(directory, ["--fixture", path]);
    expect(result.code).not.toBe(0);
    expect(result.stdout).toBe("");
  });
}, 20000);
