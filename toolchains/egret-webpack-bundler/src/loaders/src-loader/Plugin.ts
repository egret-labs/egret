import * as path from 'path';
import * as webpack from 'webpack';

declare module 'webpack' {

    export interface Compilation {
        cache: any
    }
}

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

interface SrcLoaderPluginOptions {
    onThisCompilation: ((compilation: webpack.Compilation) => void)
}

export default class SrcLoaderPlugin {

    options: SrcLoaderPluginOptions;

    constructor(options: SrcLoaderPluginOptions) {
        this.options = options;
    }


    public apply(compiler: webpack.Compiler) {
        const pluginName = this.constructor.name;
        const dirs = ['src'].map((dir) => path.join(compiler.context, dir));

        let main: webpack.NormalModule;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            getNormalModuleLoader(compilation).tap(pluginName, (loaderContext: any, m: webpack.NormalModule) => {
                if (m.resource.indexOf("Main.ts") >= 0) {
                    main = m;
                }
            });
            this.options.onThisCompilation(compilation);
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
