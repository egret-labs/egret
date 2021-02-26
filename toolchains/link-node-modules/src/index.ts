import fs from 'fs';
import * as path from 'path';

export async function linkNodeModules(packageDir: string, projectDir: string) {
    const pkgFilePath = path.join(packageDir, 'package.json');
    const packageContent = await fs.promises.readFile(pkgFilePath, 'utf-8');
    const pkgInfo = JSON.parse(packageContent) as { name: string };
    const packageName = pkgInfo.name;

    const linkDir = path.join(projectDir, 'node_modules', packageName);
    // await fs.promises.rmdir(linkDir, { recursive: true });
    if (!fs.existsSync(linkDir)) {
        await fs.promises.symlink(packageDir, linkDir, 'junction');
    }

}