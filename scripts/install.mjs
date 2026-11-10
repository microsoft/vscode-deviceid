import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

if (process.platform === "win32") {
	const require = createRequire(import.meta.url);
	const result = spawnSync(
		process.execPath,
		[require.resolve("node-gyp-build/bin.js")],
		{
			cwd: fileURLToPath(new URL("..", import.meta.url)),
			stdio: "inherit",
		},
	);
	if (result.error) {
		throw result.error;
	}
	if (result.status === null) {
		throw new Error("Native module installation did not exit normally");
	}
	process.exitCode = result.status;
}
