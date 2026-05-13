/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as fs from "fs-extra";
const windowRegistry =
	process.platform === "win32"
		? require("../build/Release/windows.node")
		: null;

const deviceIdFileName = "deviceid";

function getDirectory(): string {
	let folder: string;

	if (!process.env.HOME) {
		throw new Error("Home directory not found");
	}

	if (process.platform === "darwin") {
		folder = path.join(process.env.HOME, "Library", "Application Support");
	} else if (process.platform === "linux") {
		folder =
			process.env.XDG_CACHE_HOME ?? path.join(process.env.HOME, ".cache");
	} else {
		throw new Error("Unsupported platform");
	}

	return path.join(folder, "Microsoft", "DeveloperTools");
}

function getDeviceIdFilePath(): string {
	return path.join(getDirectory(), deviceIdFileName);
}

export async function getDeviceId(): Promise<string | undefined> {
	if (process.platform === "win32") {
		return windowRegistry?.GetDeviceId() as string;
	} else {
		if (!(await exists(getDeviceIdFilePath()))) {
			return undefined;
		} else {
			const content = await fs.readFile(getDeviceIdFilePath(), "utf8");
			// Strip a leading UTF-8 BOM (U+FEFF) if present. Node's "utf8"
			// decoding does not strip it, and a stray BOM in the device ID
			// breaks downstream consumers that put the value in HTTP headers
			// (see issue #34).
			return content.replace(/^\uFEFF/, "");
		}
	}
}

async function exists(path: string): Promise<boolean> {
	try {
		await fs.promises.access(path);

		return true;
	} catch {
		return false;
	}
}

export async function setDeviceId(deviceId: string): Promise<void> {
	if (process.platform === "win32") {
		windowRegistry?.SetDeviceId(deviceId);
	} else {
		await fs.ensureDir(getDirectory());
		await fs.writeFile(getDeviceIdFilePath(), deviceId, "utf8");
	}
}
