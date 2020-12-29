import * as webpack from 'webpack';
import { WebpackBundleOptions } from '..';
import { createProject } from '../egretproject';

export default class ResourceConfigFilePlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: WebpackBundleOptions) {

    }

    public apply(compiler: webpack.Compiler) {

        function readFileAsync(filePath: string): Promise<Buffer> {
            return new Promise((resolve, reject) => {
                compiler.inputFileSystem.readFile(filePath, (error, content) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(content);
                    }
                });
            });
        }

        const pluginName = this.constructor.name;
        compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {
            const assets = compilation.assets;
            const filepath = 'resource/default.res.json';
            try {
                const content = await readFileAsync(filepath);
                updateAssets(assets, filepath, content);
            }
            catch (e) {
                const message = `\t资源配置加载失败\n\t文件访问异常:${filepath}`;
                compilation.errors.push({ file: filepath, message });
            }

        });
    }
}

function updateAssets(assets: any, filePath: string, content: string | Buffer) {

    assets[filePath] = {
        source: () => content,
        size: () => ((typeof content === 'string') ? content.length : content.byteLength)
    };
}

type ResourceConfigFile = Parameters<typeof import('../../../../packages/assetsmanager')['initConfig']>[1];
