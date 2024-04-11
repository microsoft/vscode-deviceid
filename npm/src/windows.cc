/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

#include <string>
#include <windows.h>

#include <node_api.h>

namespace {
	const std::string DEVICEID_PATH = "SOFTWARE\\Microsoft\\DeveloperTools";
	const std::string DEVICEID_NAME = "deviceid";
	const int MAX_LEN = 16383;

	napi_value GetDeviceId(napi_env env, napi_callback_info info) {
		std::string result;

		HKEY hKey;
		if (ERROR_SUCCESS != RegOpenKeyEx(HKEY_CURRENT_USER, DEVICEID_PATH.c_str(), 0, KEY_READ | KEY_WOW64_64KEY, &hKey)) {
			napi_throw_error(env, nullptr, "Unable to open registry key");
			return nullptr;
		}

		char szBuffer[MAX_LEN];
		DWORD dwBufferSize = sizeof(szBuffer);

		if (ERROR_SUCCESS != RegQueryValueEx(hKey, DEVICEID_NAME.c_str(), 0, NULL, (LPBYTE)szBuffer, &dwBufferSize)) {
			RegCloseKey(hKey);
			napi_throw_error(env, nullptr, "Unable to open registry key");
			return nullptr;
		}

		result = szBuffer;
		RegCloseKey(hKey);

		napi_value napi_result;
		napi_create_string_utf8(env, result.c_str(), result.length(), &napi_result);

		return napi_result;
	}

	napi_value SetDeviceId(napi_env env, napi_callback_info info) {
		size_t argc = 1;
		napi_value argv[1];
		napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);

		HKEY hKey;
		if (ERROR_SUCCESS != RegCreateKeyEx(HKEY_CURRENT_USER, DEVICEID_PATH.c_str(), 0, NULL, REG_OPTION_NON_VOLATILE, KEY_ALL_ACCESS | KEY_WOW64_64KEY, NULL, &hKey, NULL)) {
			napi_throw_error(env, nullptr, "Unable to create or open registry key");
			return nullptr;
		}

		size_t strLen;
		napi_get_value_string_utf8(env, argv[0], nullptr, 0, &strLen);
		if (strLen + 1 > MAX_LEN) {
			RegCloseKey(hKey);
			napi_throw_error(env, nullptr, "String too long");
			return nullptr;
		}

		std::string value(strLen, '\0');
		napi_get_value_string_utf8(env, argv[0], &value[0], strLen + 1, nullptr);

		if (ERROR_SUCCESS != RegSetValueEx(hKey, DEVICEID_NAME.c_str(), 0, REG_SZ, (const BYTE*)value.c_str(), (DWORD)value.length())) {
			RegCloseKey(hKey);
			napi_throw_error(env, nullptr, "Unable to set registry value");
			return nullptr;
		}

		RegCloseKey(hKey);

		return nullptr;
	}

	napi_value Init(napi_env env, napi_value exports) {
		napi_value getDeviceId;
		napi_create_function(env, "GetDeviceId", NAPI_AUTO_LENGTH,
							GetDeviceId, NULL, &getDeviceId);
		napi_set_named_property(env, exports, "GetDeviceId", getDeviceId);

		napi_value setDeviceId;
		napi_create_function(env, "SetDeviceId", NAPI_AUTO_LENGTH,
							SetDeviceId, NULL, &setDeviceId);
		napi_set_named_property(env, exports, "SetDeviceId", setDeviceId);

		return exports;
	}

	NAPI_MODULE(NODE_GYP_MODULE_NAME, Init);
} // namespace