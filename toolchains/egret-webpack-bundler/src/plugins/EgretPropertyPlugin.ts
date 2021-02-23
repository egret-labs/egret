import * as webpack from 'webpack';
import { getAssetsFileSystem } from '../assets/AssetsFileSystem';
import { Transaction } from '../assets/Transaction';
import { EgretPropertyTransaction } from '../assets/transactions/EgretPropertyTransaction';

export default class EgretPropertyPlugin {


    private transactions: Transaction[] = [];
    // eslint-disable-next-line no-useless-constructor
    constructor(private options: { libraryType: 'debug' | 'release' }) {

    }

    public apply(compiler: webpack.Compiler) {

        const transaction = new EgretPropertyTransaction(this.options.libraryType);
        this.transactions.push(transaction);

        const pluginName = this.constructor.name;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            Transaction.onCompilation(this.transactions, compilation);
        });


        compiler.hooks.watchRun.tapPromise(this.constructor.name, async () => {
            this.transactions.forEach(t => t.preExecute(compiler));
            const asset = getAssetsFileSystem();
            await asset.parse(compiler);
        })
        compiler.hooks.beforeRun.tapPromise(this.constructor.name, async () => {
            this.transactions.forEach(t => t.preExecute(compiler));
            const asset = getAssetsFileSystem();
            await asset.parse(compiler);
        })

        compiler.hooks.afterEmit.tapPromise(pluginName, async () => {
            const assetsFileSystem = getAssetsFileSystem();
            await assetsFileSystem.output();
        })
    }
}