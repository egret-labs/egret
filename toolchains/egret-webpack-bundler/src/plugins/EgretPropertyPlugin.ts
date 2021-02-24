import * as webpack from 'webpack';
import { getAssetsFileSystem } from '../assets/AssetsFileSystem';
import { Transaction } from '../assets/Transaction';
import { EgretPropertyTransaction } from '../assets/transactions/EgretPropertyTransaction';
import { ResourceConfigTransaction } from '../assets/transactions/ResourceConfigTransaction';
import { readFileAsync } from '../loaders/utils';
import { ResourceConfigFactory } from './ResourceConfigFactory';
import * as path from 'path';
export default class EgretPropertyPlugin {


    private transactions: Transaction[] = [];
    // eslint-disable-next-line no-useless-constructor
    constructor(private options: { libraryType: 'debug' | 'release' }) {

    }

    private isInit = false;

    public apply(compiler: webpack.Compiler) {

        const factory = new ResourceConfigFactory();

        this.transactions.push(new EgretPropertyTransaction(this.options.libraryType));
        this.transactions.push(new ResourceConfigTransaction({ file: 'resource/default.res.json', executeBundle: true }, factory));

        compiler.hooks.watchRun.tapPromise(this.constructor.name, async () => {
            if (this.isInit) {
                return;
            }
            this.isInit = true;
            const asset = getAssetsFileSystem();
            await asset.parse(compiler);
            const file = 'resource/default.res.json'
            const content = await readFileAsync(compiler, path.join(compiler.context, file));
            factory.parse(file, content.toString());
            for (const t of this.transactions) {
                await t.prepared(compiler);
            }
        });
        compiler.hooks.beforeRun.tapPromise(this.constructor.name, async () => {
            if (this.isInit) {
                return;
            }
            this.isInit = true;
            const asset = getAssetsFileSystem();
            await asset.parse(compiler);
            const file = 'resource/default.res.json'
            const content = await readFileAsync(compiler, path.join(compiler.context, file));
            factory.parse(file, content.toString());
            for (const t of this.transactions) {
                await t.prepared(compiler);
            }
        })




        const pluginName = this.constructor.name;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            Transaction.onCompilation(this.transactions, compilation);
            compilation.hooks.processAssets.tap(pluginName, async () => {

                factory.compilation = compilation;
                const x = factory.emitConfig();
                compilation.emitAsset('resource\\default.res.json', new webpack.sources.RawSource(x));
            })
        });





        compiler.hooks.beforeRun.tapPromise(this.constructor.name, async () => {
            for (const t of this.transactions) {
                await t.prepared(compiler);
            }
            const asset = getAssetsFileSystem();
            await asset.parse(compiler);
        })

        compiler.hooks.afterEmit.tapPromise(pluginName, async () => {
            const assetsFileSystem = getAssetsFileSystem();
            await assetsFileSystem.output();
        })
    }
}