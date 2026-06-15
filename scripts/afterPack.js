'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

/**
 * electron-builder afterPack hook.
 *
 * We ship without an Apple Developer ID (`mac.identity: null`), so electron-builder
 * skips code signing. An arm64 app MUST be signed to launch at all, so we ad-hoc
 * sign the packed .app here — this runs after packing but BEFORE the .dmg is built,
 * so the dmg contains a runnable, signed app (no manual `codesign` step per build).
 *
 * Note: ad-hoc signing is not notarization. A dmg downloaded from the internet will
 * still be quarantined by Gatekeeper; on first open use right-click → Open, or
 * `xattr -dr com.apple.quarantine "/Applications/Dither Studio.app"`. Distribution
 * without that step requires a Developer ID + notarization.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  try { execFileSync('xattr', ['-dr', 'com.apple.quarantine', appPath]); } catch { /* none present */ }
  console.log(`[afterPack] ad-hoc signed ${appPath}`);
};
