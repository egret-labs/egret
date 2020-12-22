import * as cp from 'child_process';
import * as path from 'path';
import { LauncherAPI } from '.';
export function createInstallerLibrary(): LauncherAPI {
    const result = cp.execSync('npm root -g').toString().replace('\n', '');
    const libraryPath = path.join(result, '@egret/egret-library-installer');
    // eslint-disable-next-line global-require
    const x = require(libraryPath);
    return x.launcherapi;
}