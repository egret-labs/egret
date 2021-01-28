import * as path from 'path';
import * as webpack from 'webpack';
import Factory from './Factory';

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
    dirs: string[];
}

export default class SrcLoaderPlugin {
    options: SrcLoaderPluginOptions;
    constructor() {
        this.options = {
            dirs: ['src'],
        };
    }

    private dirs: string[] = [];

    private factory!: Factory;

    public apply(compiler: webpack.Compiler) {
        const pluginName = this.constructor.name;
        this.dirs = this.options.dirs.map((dir) => path.join(compiler.context, dir));

        const beforeRun = (compiler: webpack.Compiler) => {
            if (!this.factory) {
                this.factory = new Factory({
                    context: compiler.context,
                    fs: compiler.inputFileSystem as any
                });
            }
        };

        compiler.hooks.watchRun.tap(pluginName, beforeRun);
        compiler.hooks.beforeRun.tap(pluginName, beforeRun);

        let main: webpack.NormalModule;




        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {

            getNormalModuleLoader(compilation).tap(pluginName, (loaderContext: any, m: webpack.NormalModule) => {
                (loaderContext as any)['factory'] = this.factory;
                if (m.resource.indexOf("Main.ts") >= 0) {
                    main = m;
                }
            });
            this.factory.update();
            compilation.rebuildModule(main, () => {

            });
        });

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            this.dirs.forEach((item) => {
                compilation.contextDependencies.add(item);
            });
        });
    }
}
