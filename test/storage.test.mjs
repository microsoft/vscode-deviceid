import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../dist/storage.js", import.meta.url), "utf8");
const directory = fileURLToPath(new URL("../dist", import.meta.url));

function loadStorage(platform, nativeLoader) {
	const exports = {};
	runInNewContext(source, {
		exports,
		__dirname: directory,
		process: { platform, env: {} },
		require: (name) => name === "node-gyp-build" ? nativeLoader : require(name),
	});
	return exports;
}

test("Windows storage resolves prebuilds from the package root", async () => {
	const written = [];
	let loadedFrom;
	const storage = loadStorage("win32", (root) => {
		loadedFrom = root;
		return {
			GetDeviceId: () => "existing-device-id",
			SetDeviceId: (value) => written.push(value),
		};
	});
	assert.equal(loadedFrom, path.resolve(directory, ".."));
	assert.equal(await storage.getDeviceId(), "existing-device-id");
	await storage.setDeviceId("new-device-id");
	assert.deepEqual(written, ["new-device-id"]);
});

for (const platform of ["linux", "darwin", "freebsd"]) {
	test(`${platform} storage does not load a native addon`, () => {
		loadStorage(platform, () => {
			assert.fail("Native loader must not run on this platform");
		});
	});
}

test("a missing Windows native addon fails explicitly", () => {
	const failure = new Error("No native build was found");
	assert.throws(() => loadStorage("win32", () => { throw failure; }), failure);
});
