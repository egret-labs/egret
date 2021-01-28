import * as path from 'path';
import * as webpack from 'webpack';
import { Factory } from './Factory';

function getNormalModuleLoader(compilation: webpack.Compilation) {
    let normalModuleLoader;
    // if (Object.isFrozen(compilation.hooks)) {
    //     // webpack 5
    //     // eslint-disable-next-line global-require
    // normalModuleLoader = require('webpack/lib/NormalModule')
    //     .getCompilationHooks(compilation).loader;
    // } else {
    //     normalModuleLoader = compilation.hooks.normalModuleLoader;
    // }
    normalModuleLoader = compilation.hooks.normalModuleLoader;
    return normalModuleLoader;
}


export default class SrcLoaderPlugin {

    private isFirst = true;

    public apply(compiler: webpack.Compiler) {
        const pluginName = this.constructor.name;
        const factory = new Factory({ context: compiler.context });

        const beforeRun = () => {
            if (!this.isFirst) {
                return;
            }
            this.isFirst = false;
            const srcLoaderRule: webpack.RuleSetRule = {
                test: /Main\.ts/,
                loader: require.resolve('./index'),
                options: {
                    factory
                }
            };
            factory.fs = compiler.inputFileSystem as any;
            compiler.options.module?.rules.unshift(srcLoaderRule);
        }


        compiler.hooks.beforeRun.tap(pluginName, beforeRun);
        compiler.hooks.watchRun.tap(pluginName, beforeRun);

        const dirs = ['src'].map((dir) => path.join(compiler.context, dir));



        let main: webpack.NormalModule;


        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            getNormalModuleLoader(compilation).tap(pluginName, (loaderContext: any, m: webpack.NormalModule) => {
                if (m.resource.indexOf("Main.ts") >= 0) {
                    main = m;
                }
            });
            factory.update();
            compilation.rebuildModule(main, () => {

            });
        });

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            dirs.forEach((item) => {
                compilation.contextDependencies.add(item);
            });
        });
    }
}
