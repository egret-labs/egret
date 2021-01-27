import * as crypto from 'crypto';
import * as path from 'path';
import * as webpack from 'webpack';
import * as utils from '../utils';
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
    //     normalModuleLoader = require('webpack/lib/NormalModule')
    //         .getCompilationHooks(compilation).loader;
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
    private listHash: string = '';

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

            this.nsLoaderContext.factory.update();

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

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            // 注入nsLoaderContext
            getNormalModuleLoader(compilation).tap(pluginName, (loaderContext: any) => {
                loaderContext['src-loader'] = this.nsLoaderContext;
            });
            return;
            // 文件列表改变时重新编译entry
            const { factory } = this.nsLoaderContext;
            const listHash = crypto.createHash('md5')
                .update(factory.sortUnmodules().join(','))
                .digest('hex');
            if (listHash !== this.listHash && compilation.cache) {
                this.listHash = listHash;
                Object.keys(compilation.cache).forEach((id) => {
                    const filePath = id.replace(/^.*!/, '');
                    const cacheModule = compilation.cache[id];
                    if (utils.isEntry(compiler, filePath) && cacheModule) {
                        // 删除缓存
                        delete compilation.cache[id];
                    }
                });
            }
        });

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            this.dirs.forEach((item) => {
                compilation.contextDependencies.add(item);
            });
        });
    }
}
