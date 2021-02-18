import { Compilation, sources } from 'webpack';
export class AssetsFileSystem {

    private currentCompilation!: Compilation;

    updateCompilation(compilation: Compilation) {
        this.currentCompilation = compilation;
    }

    needUpdate(filePath: string) {
        return true;
    }

    update(filePath: string, content: Buffer | string) {
        this.currentCompilation.emitAsset(filePath, new sources.RawSource(content));
    }

}

const bundler = new AssetsFileSystem();

export function getAssetsFileSystem() {
    return bundler;
}