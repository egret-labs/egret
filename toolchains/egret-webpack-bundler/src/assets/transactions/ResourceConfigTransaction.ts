import * as path from 'path';
import { Compilation, Compiler, WebpackError } from 'webpack';
import { ResourceConfig, ResourceConfigFactory } from '../../plugins/ResourceConfigFactory';
import { walkDir } from '../../utils';
import { Transaction } from '../Transaction';
import { CopyFileTransaction } from './CopyFileTransaction';
import { TextureMergerTransaction } from './TextureMergerTransaction';
export type ResourceConfigFilePluginOption = { file: string, executeBundle?: boolean };

export class ResourceConfigTransaction extends Transaction {

    constructor(private options: ResourceConfigFilePluginOption, private factory: ResourceConfigFactory) {
        super(options.file);
    }

    get fileDependencies() {
        return [this.options.file];
    }

    async prepare2(compiler: Compiler) {
        const bundleInfo = this.options;
        const { file, executeBundle } = bundleInfo;
        const fullFilepath = path.join(compiler.context, file);

        // const existed = fs.existsSync(fullFilepath);
        // if (!existed) {
        //     throw new Error(fullFilepath + '不存在');
        // }
        try {

            const factory = this.factory;

            const root = path.join(compiler.context, 'resource');
            const entities = await getAllTextureMergerConfig(root);
            for (const e of entities) {
                const t = new TextureMergerTransaction(e.path, factory);
                this.addSubTransaction(t);
                t.prepare2(compiler);
            }
            const config = factory.config;
            for (const x of config.resources as ResourceConfig[]) {
                if (!x.isEmitted) {
                    this.addSubTransaction(new CopyFileTransaction('resource/' + x.url));
                }

            }

        }
        catch (e) {
            const message = `\t资源配置处理异常\n\t${e.message}`;
            const webpackError = new WebpackError(message);
            webpackError.file = file;
        }
    }

    async execute2(compilation: Compilation) {
        // const assetsFileSystem = getAssetsFileSystem();

        // const bundleInfo = this.options;
        // const compiler = compilation.compiler;
        // const { file, executeBundle } = bundleInfo;
        // const fullFilepath = path.join(compiler.context, file);
        // // const existed = fs.existsSync(fullFilepath);
        // // if (!existed) {
        // //     throw new Error(fullFilepath + '不存在');
        // // }
        // if (await assetsFileSystem.needUpdate(bundleInfo.file)) {
        //     try {
        //         const factory = this.factory;
        //         factory.compilation = compilation;
        //         // if (executeBundle) {
        //         //     await factory.execute();
        //         // }
        //         const output = factory.emitConfig();
        //         assetsFileSystem.update(compilation, { filePath: bundleInfo.file, dependencies: this.fileDependencies }, output);
        //     }
        //     catch (e) {
        //         const message = `\t资源配置处理异常\n\t${e.message}`;
        //         const webpackError = new WebpackError(message);
        //         webpackError.file = file;
        //         compilation.getErrors().push(webpackError);
        //     }
        // }

    }
}

async function getAllTextureMergerConfig(root: string) {
    const entities = await walkDir(root);
    return entities.filter((e) => e.name === 'texture-merger.yaml');
}