import * as webpack from 'webpack';
import { TransactionManager } from '../assets/TransactionManager';
import { EgretPropertyTransaction } from '../assets/transactions/EgretPropertyTransaction';
import { ResourceConfigTransaction } from '../assets/transactions/ResourceConfigTransaction';
import { readFileAsync } from '../loaders/utils';
import { WebpackBundleOptions } from '../options/typings';
export default class ResourceTransactionPlugin {

    private transactionManager!: TransactionManager;

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: WebpackBundleOptions) {

    }

    private isInit = false;

    public apply(compiler: webpack.Compiler) {

        this.transactionManager = new TransactionManager(compiler.context);
        this.transactionManager.create(EgretPropertyTransaction, this.options);
        this.transactionManager.create(ResourceConfigTransaction, 'resource/default.res.json');

        this.transactionManager.inputFileSystem = {
            readFileAsync: (filepath: string) => {
                return readFileAsync(compiler, filepath) as any;
            }
        };

        compiler.hooks.watchRun.tapPromise(this.constructor.name, async () => {

            if (!this.isInit) {
                await this.transactionManager.project.link();
                await this.transactionManager.initialize();
                await this.transactionManager.addTextureMerger();
                this.isInit = true;
            }
            await this.transactionManager.prepare();

        });
        compiler.hooks.beforeRun.tapPromise(this.constructor.name, async () => {

            if (!this.isInit) {
                await this.transactionManager.project.link();
                await this.transactionManager.initialize();
                await this.transactionManager.addTextureMerger();
                this.isInit = true;
            }
            await this.transactionManager.prepare();
        });

        const pluginName = this.constructor.name;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            this.transactionManager.outputFileSystem = {
                emitAsset: (file, content) => {
                    compilation.emitAsset(file, new webpack.sources.RawSource(content));
                }
            };
            compilation.hooks.processAssets.tapPromise(pluginName, async () => {
                await this.transactionManager.execute();
                await this.transactionManager.finish();
            });
        });

        // compiler.hooks.afterEmit.tapPromise(pluginName, async () => {
        //     const assetsFileSystem = getAssetsFileSystem();
        //     await assetsFileSystem.output();
        // })
    }
}