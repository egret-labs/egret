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
    dirs?: string[];
}

export interface SrcLoaderContext {
    factory: Factory;
}

export default class SrcLoaderPlugin {
    options: SrcLoaderPluginOptions;
    constructor(options: SrcLoaderPluginOptions = {}) {
        this.options = {
            dirs: ['src'],
            ...options
        };
    }

    private nsLoaderContext: SrcLoaderContext = null as any;
    private dirs: string[] = [];

    public apply(compiler: webpack.Compiler) {
        const pluginName = this.constructor.name;
        this.nsLoaderContext = {
            factory: null as any
        };
        this.dirs = (this.options.dirs || []).map((dir) => path.join(compiler.context, dir));

        const beforeRun = (_compiler: any, callback: any) => {
            if (!this.nsLoaderContext.factory) {
                this.nsLoaderContext.factory = new Factory({
                    context: compiler.context,
                    fs: compiler.inputFileSystem as any
                });
            }


            callback();
        };

        compiler.hooks.watchRun.tapAsync(pluginName, beforeRun);
        compiler.hooks.beforeRun.tapAsync(pluginName, beforeRun);

        // 接收thm信息
        // compiler.hooks.themePluginResult.tap(pluginName, ({ skins, deps }) => {
        // this.nsLoaderContext.skins = skins;
        // addDeps(deps);
        // });

        // 接收res信息
        // compiler.hooks.resourcePluginResult.tap(pluginName, ({ deps }) => {
        // addDeps(deps);
        // });

        let main: webpack.NormalModule;




        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {

            // 注入nsLoaderContext
            getNormalModuleLoader(compilation).tap(pluginName, (loaderContext: any, m: webpack.NormalModule) => {
                (loaderContext as any)['src-loader'] = this.nsLoaderContext;
                if (m.resource.indexOf("Main.ts") >= 0) {
                    main = m;
                }
            });
            this.nsLoaderContext.factory.update();
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
