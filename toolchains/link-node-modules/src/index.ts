import fs from 'fs';
import * as path from 'path';

interface PKG_JSON {
    name: string;

    bin?: {
        [index: string]: string
    }
}

export async function linkNodeModules(packageDir: string, projectDir: string) {
    const pkgFilePath = path.join(packageDir, 'package.json');
    const packageContent = await fs.promises.readFile(pkgFilePath, 'utf-8');
    const pkgInfo = JSON.parse(packageContent) as PKG_JSON;
    const packageName = pkgInfo.name;

    const linkDir = path.join(projectDir, 'node_modules', packageName);
    // await fs.promises.rmdir(linkDir, { recursive: true });
    if (!fs.existsSync(linkDir)) {
        await fs.promises.symlink(packageDir, linkDir, 'junction');
    };
    if (pkgInfo.bin) {
        // eslint-disable-next-line global-require
        const cmdShim = require('cmd-shim');

        for (const key in pkgInfo.bin) {
            const value = pkgInfo.bin[key];
            const cliPath = path.join(packageDir, value);
            const cmd = path.join(projectDir, 'node_modules', '.bin', key);
            await cmdShim(cliPath, cmd);
        }
    }

}