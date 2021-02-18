import { Compilation, Compiler, sources } from 'webpack';
import * as fs from 'fs'
import * as util from 'util';
import * as yaml from 'js-yaml';

interface AssetFile {

    filePath: string

    dependencies: string[]

    mtime: string
}

export class AssetsFileSystem {

    private map: Map<string, AssetFile> = new Map();

    private currentCompilation!: Compilation;
    private compiler!: Compiler;

    updateCompilation(compilation: Compilation) {
        this.currentCompilation = compilation;
        this.compiler = this.currentCompilation.compiler;
    }

    async add(input: Pick<AssetFile, 'filePath' | 'dependencies'>) {
        const file = input as AssetFile;
        const statAsync = util.promisify(this.compiler.inputFileSystem.stat);
        try {
            const mtime = (await statAsync(input.filePath))?.mtime.toTimeString();
            file.mtime = mtime || "";
        }
        catch (e) {

        }

        this.map.set(input.filePath, file);
        const { dependencies } = file;
        for (let dependencyFilePath of dependencies) {
            await this.add({ filePath: dependencyFilePath, dependencies: [] })
        }
    }

    needUpdate(filePath: string) {
        const file = this.map.get(filePath);
        if (!file) {
            throw new Error(filePath);
        }
        const { dependencies } = file;
        // const statAsync = util.promisify(this.compiler.inputFileSystem.stat);
        // for (let d of dependencies) {s
        return true;
    }

    update(filePath: string, content: Buffer | string) {
        this.currentCompilation.emitAsset(filePath, new sources.RawSource(content));
    }

    async output() {
        const writeFileAsync = util.promisify(this.compiler.outputFileSystem.writeFile);

        const result: any = {};
        for (let x of this.map) {
            const { dependencies, mtime } = x[1];
            result[x[0]] = { dependencies, mtime }
        }
        const output = yaml.dump(result, {
            flowLevel: 3,
            styles: {
                '!!int': 'hexadecimal',
                '!!null': 'camelcase'
            }
        });
        await writeFileAsync('dist/assets-file-manifest.yaml', output)
    }

}

const bundler = new AssetsFileSystem();

export function getAssetsFileSystem() {
    return bundler;
}