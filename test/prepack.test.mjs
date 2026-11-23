import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";

for (const missing of ["x64", "arm64"]) {
	test(`packing rejects a missing Windows ${missing} prebuild`, (context) => {
		const directory = mkdtempSync(path.join(tmpdir(), "deviceid-prepack-"));
		context.after(() => rmSync(directory, { recursive: true, force: true }));
		mkdirSync(path.join(directory, "scripts"));
		const script = path.join(directory, "scripts", "check-prebuilds.mjs");
		copyFileSync(new URL("../scripts/check-prebuilds.mjs", import.meta.url), script);
		const present = missing === "x64" ? "arm64" : "x64";
		const prebuild = path.join(directory, "prebuilds", `win32-${present}`);
		mkdirSync(prebuild, { recursive: true });
		writeFileSync(path.join(prebuild, "@vscode+deviceid.node"), "fixture");
		const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
		assert.ifError(result.error);
		assert.equal(result.status, 1);
		assert.match(result.stderr, new RegExp(`win32-${missing}`));
	});
}
