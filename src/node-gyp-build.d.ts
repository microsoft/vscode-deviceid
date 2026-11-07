declare module "node-gyp-build" {
	function loadNativeModule(directory: string): unknown;
	export = loadNativeModule;
}
