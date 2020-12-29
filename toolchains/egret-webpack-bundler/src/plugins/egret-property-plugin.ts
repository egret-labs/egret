import * as webpack from 'webpack';
import { WebpackBundleOptions } from '..';
import { getLibsFileList } from '../egretproject';

export default class EgretPropertyPlugin {

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
            const scripts = getLibsFileList('web', compiler.context, this.options.libraryType);
            const manifest = { initial: scripts, game: ['main.js'] };
            const manifestContent = JSON.stringify(manifest, null, '\t');
            const assets = compilation.assets;
            updateAssets(assets, 'manifest.json', manifestContent);
            for (const script of manifest.initial) {
                try {
                    const content = await readFileAsync(script);
                    updateAssets(assets, script, content);
                }
                catch (e) {
                    const message = `文件访问失败:${script}`;
                    compilation.errors.push({ file: 'egretProperties.json', message });
                }

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
