/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

if (
	process.platform !== "win32" &&
	process.platform !== "darwin" &&
	process.platform !== "linux" &&
	process.platform !== "freebsd"
) {
	throw new Error("Unsupported platform");
}

export * from "./devdeviceid.js";
