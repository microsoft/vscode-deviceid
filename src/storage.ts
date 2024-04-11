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
		if (!fs.existsSync(getDeviceIdFilePath())) {
			return undefined;
		} else {
			return fs.readFile(getDeviceIdFilePath(), "utf8");
		}
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
