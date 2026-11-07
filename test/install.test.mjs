import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";

function runInstaller(platform, exitCode, context) {
	const directory = mkdtempSync(path.join(tmpdir(), "deviceid-install-"));
	context.after(() => rmSync(directory, { recursive: true, force: true }));
	mkdirSync(path.join(directory, "scripts"));
	const loaderDirectory = path.join(directory, "node_modules", "node-gyp-build");
	mkdirSync(loaderDirectory, { recursive: true });
	copyFileSync(
		new URL("../scripts/install.mjs", import.meta.url),
		path.join(directory, "scripts", "install.mjs"),
	);
	const marker = path.join(directory, "invoked");
	writeFileSync(
		path.join(loaderDirectory, "bin.js"),
		`require("node:fs").writeFileSync(${JSON.stringify(marker)}, ""); process.exit(${exitCode});`,
	);
	const preload = `Object.defineProperty(process, "platform", { value: ${JSON.stringify(platform)} });`;
	const result = spawnSync(process.execPath, [
		"--import", `data:text/javascript,${encodeURIComponent(preload)}`,
		path.join(directory, "scripts", "install.mjs"),
	], { encoding: "utf8" });
	assert.ifError(result.error);
	return { result, invoked: existsSync(marker) };
}

for (const platform of ["linux", "darwin", "freebsd"]) {
	test(`installation on ${platform} skips native tooling`, (context) => {
		const { result, invoked } = runInstaller(platform, 9, context);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(invoked, false);
	});
}

test("Windows installation delegates to the prebuild-aware installer", (context) => {
	const { result, invoked } = runInstaller("win32", 0, context);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(invoked, true);
});

test("Windows installation propagates native build failures", (context) => {
	const { result, invoked } = runInstaller("win32", 7, context);
	assert.equal(result.status, 7, result.stderr);
	assert.equal(invoked, true);
});
