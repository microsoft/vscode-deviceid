/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { v4 as uuidv4 } from "uuid";
import * as storage from "./storage.js";

export async function getDeviceId(): Promise<string> {
	let deviceId: string | undefined;
	try {
		deviceId = await storage.getDeviceId();
	} catch (e) {
		// Regenerate the deviceId if it cannot be read
	}

	if (deviceId) {
		return deviceId;
	} else {
		const newDeviceId = uuidv4().toLowerCase();
		await storage.setDeviceId(newDeviceId);
		return newDeviceId;
	}
}
