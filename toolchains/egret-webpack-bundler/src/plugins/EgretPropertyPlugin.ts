import * as webpack from 'webpack';
import { Compilation } from 'webpack';
import { WebpackBundleOptions } from '..';
import { createProject } from '../egretproject';

export default class EgretPropertyPlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: { libraryType: 'debug' | 'release' }) {

    }

    public apply(compiler: webpack.Compiler) {

        function readFileAsync(filePath: string): Promise<Buffer> {
            return new Promise((resolve, reject) => {
                compiler.inputFileSystem.readFile(filePath, (error, content) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(content as any);
                    }
                });
            });
        }

        const pluginName = this.constructor.name;
        // compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {
        //     const assets = compilation.assets;

        // });

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tapPromise(pluginName, async (assets) => {
                await execute(assets, compilation);
            });
        });

        const execute = async (assets: any, compilation: Compilation) => {
            const project = createProject(compiler.context);
            const egretModules = project.getModulesConfig('web');
            const initial: string[] = [];
            for (const m of egretModules) {
                for (const asset of m.target) {
                    const filename = this.options.libraryType == 'debug' ? asset.debug : asset.release;
                    initial.push(filename);
                    try {

                        const content = await readFileAsync(filename);
                        const source = new webpack.sources.RawSource(content, false);
                        compilation.emitAsset(filename, source);
                        // updateAssets(assets, filename, content);
                    }
                    catch (e) {
                        const message = `\t模块加载失败:${m.name}\n\t文件访问异常:${filename}`;
                        compilation.errors.push({ file: 'egretProperties.json', message } as any);
                    }
                }
            }
            const manifest = { initial, game: ['main.js'] };
            const manifestContent = JSON.stringify(manifest, null, '\t');
            updateAssets(assets, 'manifest.json', manifestContent);
        };
    }
}

function updateAssets(assets: any, filePath: string, content: string | Buffer) {
    assets[filePath] = {
        source: () => content,
        size: () => ((typeof content === 'string') ? content.length : content.byteLength)
    };
}

function execute() {

}