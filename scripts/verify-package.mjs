import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
	existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const metadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const tarball = path.join(
	process.argv[2] ?? root,
	`${metadata.name.replace(/^@/, "").replace("/", "-")}-${metadata.version}.tgz`,
);
const npm = process.env.npm_execpath;
assert.ok(npm, "Run this check through npm run test:package");

const entries = execFileSync("tar", ["-tf", tarball], { encoding: "utf8" }).split(/\r?\n/);
for (const architecture of ["x64", "arm64"]) {
	assert.ok(entries.includes(`package/prebuilds/win32-${architecture}/@vscode+deviceid.node`));
}
assert.ok(entries.includes("package/scripts/install.mjs"));
assert.ok(entries.includes("package/src/windows.cc"));
assert.ok(!entries.some((entry) => /\.pdb$|^package\/(?:build|symbols|test)\//.test(entry)));

const temporary = mkdtempSync(path.join(tmpdir(), "deviceid-package-"));
try {
	for (const ignoreScripts of [false, true]) {
		const consumer = path.join(temporary, ignoreScripts ? "scripts-disabled" : "normal");
		const tools = path.join(consumer, "node_modules", ".bin");
		mkdirSync(tools, { recursive: true });
		writeFileSync(path.join(consumer, "package.json"), '{"name":"deviceid-consumer","private":true}');
		const attemptedBuild = path.join(consumer, "attempted-build");
		writeFileSync(
			path.join(tools, "node-gyp.cmd"),
			`@echo off\r\necho unexpected build > "${attemptedBuild}"\r\nexit /b 99\r\n`,
		);
		const env = {
			...process.env,
			PATH: `${tools}${path.delimiter}${path.dirname(process.execPath)}`,
			npm_config_build_from_source: "false",
			npm_config_node_gyp: path.join(tools, "node-gyp.cmd"),
		};
		execFileSync(process.execPath, [
			npm, "install", tarball, "--prefer-offline", "--omit=dev", "--no-audit", "--no-fund",
			"--foreground-scripts", ...(ignoreScripts ? ["--ignore-scripts"] : []),
		], { cwd: consumer, env, stdio: "inherit" });
		const installed = path.join(consumer, "node_modules", "@vscode", "deviceid");
		assert.ok(!existsSync(attemptedBuild), "Installation attempted a source build");
		assert.ok(!existsSync(path.join(installed, "build")));
		for (const architecture of ["x64", "arm64"]) {
			const binary = path.join("prebuilds", `win32-${architecture}`, "@vscode+deviceid.node");
			assert.deepEqual(readFileSync(path.join(installed, binary)), readFileSync(path.join(root, binary)));
		}
		execFileSync(process.execPath, ["-e", `
			const assert = require("node:assert/strict");
			assert.equal(typeof require("@vscode/deviceid").getDeviceId, "function");
			const addon = require("node-gyp-build")(${JSON.stringify(installed)});
			assert.equal(typeof addon.GetDeviceId, "function");
			assert.equal(typeof addon.SetDeviceId, "function");
		`], { cwd: consumer, env, stdio: "inherit" });
		console.log(`Packed native addon loaded (install scripts ${ignoreScripts ? "disabled" : "enabled"})`);
	}
} finally {
	rmSync(temporary, { recursive: true, force: true });
}
