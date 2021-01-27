import * as path from 'path';
import * as webpack from 'webpack';
import { createProject } from '../egretproject';
import { fileChanged, readFileAsync } from '../loaders/utils';

export default class EgretPropertyPlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: { libraryType: 'debug' | 'release' }) {

    }

    public apply(compiler: webpack.Compiler) {

        const pluginName = this.constructor.name;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            const fullFilepath = path.join(compiler.context, 'egretProperties.json');
            compilation.fileDependencies.add(fullFilepath);
            if (fileChanged(compiler, fullFilepath)) {
                compilation.hooks.processAssets.tapPromise(pluginName, async (assets) => {
                    await execute(compiler, compilation, this.options.libraryType);
                });
            }
        });
    }
}

async function execute(compiler: webpack.Compiler, compilation: webpack.Compilation, libraryType: 'debug' | 'release') {
    const project = createProject(compiler.context);
    const egretModules = project.getModulesConfig('web');
    const initial: string[] = [];
    for (const m of egretModules) {
        for (const asset of m.target) {
            const filename = libraryType == 'debug' ? asset.debug : asset.release;
            initial.push(filename);
            try {
                const content = await readFileAsync(compiler, filename);
                const source = new webpack.sources.RawSource(content, false);
                compilation.emitAsset(filename, source);
            }
            catch (e) {
                const message = `\t模块加载失败:${m.name}\n\t文件访问异常:${filename}`;
                const webpackError = new webpack.WebpackError(message);
                webpackError.file = 'egretProperties.json';
                compilation.getErrors().push(webpackError);
            }
        }
    }
    const manifest = { initial, game: ['main.js'] };
    const manifestContent = JSON.stringify(manifest, null, '\t');
    compilation.emitAsset('manifest.json', new webpack.sources.RawSource(manifestContent));
};