import * as webpack from 'webpack';
import { getAssetsFileSystem } from '../assets/AssetsFileSystem';
import { EgretPropertyTransaction } from '../assets/transactions/EgretPropertyTransaction';
import * as path from 'path';
import { fileChanged } from '../loaders/utils';

export default class EgretPropertyPlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: { libraryType: 'debug' | 'release' }) {

    }

    public apply(compiler: webpack.Compiler) {

        const pluginName = this.constructor.name;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            const transaction = new EgretPropertyTransaction(this.options.libraryType);
            transaction.onStart(compilation);
            const fullPaths = transaction.fileDependencies.map(p => path.join(compiler.context, p));
            for (let fullFilepath of fullPaths) {
                compilation.fileDependencies.add(fullFilepath);
                if (fileChanged(compiler, fullFilepath)) {
                    compilation.hooks.processAssets.tapPromise(pluginName, async (assets) => {
                        await transaction.execute(compilation);
                    });
                    break;
                }
            }
        });


        compiler.hooks.watchRun.tapPromise(this.constructor.name, async () => {
            const asset = getAssetsFileSystem();
            await asset.parse(compiler);
        })
        compiler.hooks.beforeRun.tapPromise(this.constructor.name, async () => {
            const asset = getAssetsFileSystem();
            await asset.parse(compiler);
        })

        compiler.hooks.afterEmit.tapPromise(pluginName, async () => {
            const assetsFileSystem = getAssetsFileSystem();
            await assetsFileSystem.output();
        })
    }
}