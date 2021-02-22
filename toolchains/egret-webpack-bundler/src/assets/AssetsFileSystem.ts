import * as yaml from 'js-yaml';
import * as util from 'util';
import { Compilation, Compiler, sources } from 'webpack';
import * as path from 'path';
interface AssetFile {

    filePath: string

    dependencies: string[]

    mtime: string
}


const log: MethodDecorator = (target: any, key, descriptor) => {
    const method = target[key]
    descriptor.value = function (this: any) {
        const result = method.apply(this, arguments);
        const p = arguments;
        result.then((v: boolean) => {
            console.log('call', key, 'param', p, 'result', v);
        })


        return result;
    } as any;
}

export class AssetsFileSystem {

    private map: Map<string, AssetFile> = new Map();

    private compiler!: Compiler;

    private async add(input: Pick<AssetFile, 'filePath' | 'dependencies'>) {
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

    // @log
    async needUpdate(filePath: string) {
        const statAsync = util.promisify(this.compiler.inputFileSystem.stat.bind(this.compiler.inputFileSystem));
        const file = this.map.get(filePath);
        if (!file) {
            return true;
        }
        if (file.mtime) {
            const mtime = (await statAsync(file.filePath))?.mtime.toTimeString();
            if (mtime !== file.mtime) {
                return true;
            }
        }
        const { dependencies } = file;

        for (let d of dependencies) {
            const dFile = this.map.get(d);
            if (!dFile) {
                return true;
            }
            try {
                const mtime = (await statAsync(d))?.mtime.toTimeString();
                if (mtime !== dFile.mtime) {
                    return true;
                }
            }
            catch (e) {
                return true;
            }
        }
        return false;
    }

    update(compilation: Compilation, input: Pick<AssetFile, 'filePath' | 'dependencies'>, content: Buffer | string) {
        const { filePath } = input;
        this.add(input);
        compilation.emitAsset(filePath, new sources.RawSource(content));
    }

    private isParsed = false;

    async parse(compiler: Compiler) {
        this.compiler = compiler;
        if (this.isParsed) {
            return;
        }
        this.isParsed = true;
        const readFileAsync = util.promisify(compiler.outputFileSystem.readFile.bind(compiler.outputFileSystem));
        try {
            const buffer = await readFileAsync('dist/assets-file-manifest.yaml');
            const content = buffer?.toString()!;
            const data = yaml.load(content) as any;;
            for (let filePath in data) {
                const { dependencies, mtime } = data[filePath]
                const file = { filePath, dependencies, mtime };
                this.map.set(filePath, file);
            }
        }
        catch (e) {
        }
    }

    async output() {
        const writeFileAsync = util.promisify(this.compiler.outputFileSystem.writeFile.bind(this.compiler.outputFileSystem));

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
        const filepath = path.join(this.compiler.context, 'dist/assets-file-manifest.yaml');
        await writeFileAsync(filepath, output)
    }

}

const bundler = new AssetsFileSystem();

export function getAssetsFileSystem() {
    return bundler;
}