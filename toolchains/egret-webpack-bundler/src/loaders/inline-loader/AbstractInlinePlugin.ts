import * as webpack from 'webpack';
import { LineEmitter } from '.';
import { Factory } from '../src-loader/Factory';

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

export abstract class AbstractInlinePlugin {

    private isFirst = true;

    protected abstract createLineEmitter(compiler: webpack.Compiler): LineEmitter;

    protected abstract onThisCompilation(compilation: webpack.Compilation): void;

    public apply(compiler: webpack.Compiler) {
        const pluginName = this.constructor.name;
        const factory = new Factory({ context: compiler.context });

        const emitter: LineEmitter = this.createLineEmitter(compiler);

        const beforeRun = () => {
            if (!this.isFirst) {
                return;
            }
            this.isFirst = false;
            const srcLoaderRule: webpack.RuleSetRule = {
                test: /Main\.ts/,
                loader: require.resolve('../inline-loader'),
                options: {
                    factory,
                    lineEmitters: [emitter]
                }
            };

            compiler.options.module?.rules.unshift(srcLoaderRule);
        };

        compiler.hooks.beforeRun.tap(pluginName, beforeRun);
        compiler.hooks.watchRun.tap(pluginName, beforeRun);

        let main: webpack.NormalModule;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            getNormalModuleLoader(compilation).tap(pluginName, (loaderContext: any, m: webpack.NormalModule) => {
                if (m.resource.indexOf("Main.ts") >= 0) {
                    if (!main) {
                        const lineEmitters: LineEmitter[] = loaderContext.lineEmitters || [];
                        lineEmitters.push(this.createLineEmitter(compiler));
                        loaderContext.lineEmitters = lineEmitters;
                        main = m;
                    }
                }
            });
            this.onThisCompilation(compilation);
            compilation.rebuildModule(main, () => {
            });
        });
    }
}
