import * as path from 'path';
import { Compilation, Compiler, WebpackError } from "webpack";
import { readFileAsync } from "../../loaders/utils";
import { ResourceConfigFactory } from "../../plugins/ResourceConfigFactory";
import { getAssetsFileSystem } from '../AssetsFileSystem';
import { Transaction } from "../Transaction";
import { CopyFileTransaction } from './CopyFileTransaction';
export type ResourceConfigFilePluginOption = { file: string, executeBundle?: boolean };

export class ResourceConfigTransaction extends Transaction {


    constructor(private options: ResourceConfigFilePluginOption) {
        super();
    }

    get fileDependencies() {
        return [this.options.file]
    }

    async preExecute(compiler: Compiler) {
        const assetsFileSystem = getAssetsFileSystem();
        const bundleInfo = this.options;
        const { file, executeBundle } = bundleInfo;
        const fullFilepath = path.join(compiler.context, file);
        // const existed = fs.existsSync(fullFilepath);
        // if (!existed) {
        //     throw new Error(fullFilepath + '不存在');
        // }
        try {
            const content = await readFileAsync(compiler, fullFilepath);
            const factory = new ResourceConfigFactory();
            factory.parse(file, content.toString());
            const config = factory.config;
            for (let x of config.resources) {
                this.addSubTransaction(new CopyFileTransaction('resource/' + x.url));
            }
        }
        catch (e) {
            const message = `\t资源配置处理异常\n\t${e.message}`;
            const webpackError = new WebpackError(message);
            webpackError.file = file;
        }
    }

    async execute(compilation: Compilation) {
        const assetsFileSystem = getAssetsFileSystem();

        const bundleInfo = this.options;
        const compiler = compilation.compiler;
        const { file, executeBundle } = bundleInfo;
        const fullFilepath = path.join(compiler.context, file);
        // const existed = fs.existsSync(fullFilepath);
        // if (!existed) {
        //     throw new Error(fullFilepath + '不存在');
        // }
        if (await assetsFileSystem.needUpdate(bundleInfo.file)) {
            try {
                const content = await readFileAsync(compiler, fullFilepath);
                const factory = new ResourceConfigFactory();
                factory.compilation = compilation;
                factory.parse(file, content.toString());
                // if (executeBundle) {
                //     await factory.execute();
                // }
                const output = factory.emitConfig();
                assetsFileSystem.update(compilation, { filePath: bundleInfo.file, dependencies: this.fileDependencies }, output);
            }
            catch (e) {
                const message = `\t资源配置处理异常\n\t${e.message}`;
                const webpackError = new WebpackError(message);
                webpackError.file = file;
                compilation.getErrors().push(webpackError);
            }
        }

    }
}