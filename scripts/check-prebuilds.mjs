import { statSync } from "node:fs";

for (const architecture of ["x64", "arm64"]) {
	const binary = new URL(
		`../prebuilds/win32-${architecture}/@vscode+deviceid.node`,
		import.meta.url,
	);
	const stats = statSync(binary);
	if (!stats.isFile() || stats.size === 0) {
		throw new Error(`Missing Windows ${architecture} prebuild: ${binary}`);
	}
}
