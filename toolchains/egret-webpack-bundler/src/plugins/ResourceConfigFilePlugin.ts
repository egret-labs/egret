import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import { fileChanged, readFileAsync } from '../loaders/utils';
import { ResourceConfigFactory } from './ResourceConfigFactory';

export type ResourceConfigFilePluginOptions = { file: string, executeBundle?: boolean }[];

export default class ResourceConfigFilePlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: ResourceConfigFilePluginOptions) {
    }

    public apply(compiler: webpack.Compiler) {

        const pluginName = this.constructor.name;

        const bundleInfo = this.options[0];
        const { file, executeBundle } = bundleInfo;
        const fullFilepath = path.join(compiler.context, file);
        const existed = fs.existsSync(fullFilepath);
        if (!existed) {
            throw new Error(fullFilepath + '不存在');
        }
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            if (!fileChanged(compiler, fullFilepath)) {
                return;
            }
            compilation.hooks.processAssets.tapPromise(pluginName, async (assets) => {
                try {
                    const content = await readFileAsync(compiler, fullFilepath);
                    compilation.fileDependencies.add(fullFilepath);
                    const factory = new ResourceConfigFactory();
                    factory.compilation = compilation;
                    factory.parse(file, content.toString());
                    if (executeBundle) {
                        await factory.execute();
                    }
                    factory.emitConfig();
                }
                catch (e) {
                    const message = `\t资源配置处理异常\n\t${e.message}`;
                    const webpackError = new webpack.WebpackError(message);
                    webpackError.file = file;
                    compilation.getErrors().push(webpackError);
                }
            });
        });
    }
}
