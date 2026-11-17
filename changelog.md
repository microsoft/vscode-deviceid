# Changelog

## 0.2.0

### Precompiled Windows native addon

The npm package now includes precompiled Node-API 8 `.node` files for Windows
x64 and arm64. Supported Windows installations no longer require Python, Visual
Studio C++ tools, or Spectre-mitigated libraries. The prebuilds also work when
npm install scripts are disabled.

#### Updating consumer packaging

- **Normal npm dependencies:** update `@vscode/deviceid` to `^0.2.0` in
  `dependencies` and update the lockfile. npm installs the prebuilds automatically;
  no extra copy step is needed.
- **Bundled applications and extensions:** the addon is now resolved at runtime.
  A webpack `node-loader` rule that previously emitted
  `dist/node_modules/deviceid/build/Release/windows.node` is no longer sufficient.
  Remove the deviceid-specific rule, but retain any rules needed by other addons.
  Leave this package external to the JavaScript bundle, for example:

  ```js
  externals: {
    '@vscode/deviceid': 'commonjs @vscode/deviceid',
  }
  ```

- **Standalone distributions:** stage the installed package and its production
  dependencies in a `node_modules` directory resolvable from the output bundle.
  For example, run `npm ci --omit=dev --ignore-scripts` in a staging project with
  the application's production dependency manifest and matching lockfile. Include
  that staging output in the application archive, VSIX, or downstream NuGet.
  Preserve the package layout:

  ```text
  node_modules/@vscode/deviceid/
    package.json
    dist/
    prebuilds/
      win32-x64/@vscode+deviceid.node
      win32-arm64/@vscode+deviceid.node
  ```

  Keep the package's runtime dependencies, including `node-gyp-build`, resolvable.
  Do not rename the binaries to `windows.node` or flatten the `prebuilds` directory.
  Remove stale deviceid `build/Release` outputs rather than shipping an older
  locally compiled binary alongside the prebuilds.
- **Package filters:** update allowlists, copy steps, and exclusions such as
  `.vscodeignore` so they retain the external package and its runtime dependencies.
  An existing `node_modules/**` exclusion must not discard the staged dependencies.
  Replace platform filters targeting the old `windows.node` path. Ship both
  prebuild directories for a shared Windows package, or retain only the directory
  matching the target Node process architecture for an architecture-specific
  package. Non-Windows packages do not need the Windows binaries.
- **Validation:** load `@vscode/deviceid` from the final extracted distribution on
  each supported Windows architecture, with native build tools unavailable.
  Confirm that both the public package and native exports load; merely checking
  that the `.node` file exists does not validate the runtime layout.

Unsupported Windows architectures still require a source build. Set
`npm_config_build_from_source=true` to request one explicitly; source builds still
require the native toolchain. Matching prebuild PDBs are retained in the CI build
drop, not the npm package or consumer application.
