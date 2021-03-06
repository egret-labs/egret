import * as fs from 'fs';
import * as webpack from 'webpack';
import { LineEmitter } from '.';
import { fileChanged } from '../utils';

function getNormalModuleLoader(compilation: webpack.Compilation) {
    // if (Object.isFrozen(compilation.hooks)) {
    //     // webpack 5
    const normalModuleLoader = webpack.NormalModule.getCompilationHooks(compilation).loader;
    return normalModuleLoader;
    // } else {
    //     normalModuleLoader = compilation.hooks.normalModuleLoader;
    // }
    // normalModuleLoader = compilation.hooks.normalModuleLoader;
    // return normalModuleLoader;
}

export abstract class AbstractInlinePlugin {

    private isFirst = true;

    protected abstract createLineEmitter(compiler: webpack.Compiler): LineEmitter;

    protected abstract onChange(compilation: webpack.Compilation): void;

    private fileDependencies: string[] = [];
    private contextDependencies: string[] = [];


    addFileDependency(filepath: string) {
        this.fileDependencies.push(filepath);
    }

    addContextDependency(dir: string) {
        this.contextDependencies.push(dir);
    }

    protected get entryFilePath() {
        return 'src/Main.ts';
    }

    apply(compiler: webpack.Compiler) {
        const pluginName = this.constructor.name;
        const emitter: LineEmitter = this.createLineEmitter(compiler);

        const beforeRun = () => {
            if (!this.isFirst) {
                return;
            }
            this.isFirst = false;
            const srcLoaderRule: webpack.RuleSetRule = {
                test: (value: string) => {
                    return value.split("\\").join("/").indexOf(this.entryFilePath) >= 0
                },
                loader: require.resolve('../inline-loader'),
                options: {
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
                if (m.resource.indexOf("src/Main.ts") >= 0) {
                    if (!main) {
                        // const lineEmitters: LineEmitter[] = loaderContext.lineEmitters || [];
                        // lineEmitters.push(this.createLineEmitter(compiler));
                        // loaderContext.lineEmitters = lineEmitters;
                        main = m;
                    }
                }
            });
            const changed = this.contextDependencies.concat(this.fileDependencies).some((v) => {
                return fileChanged(compiler, v);
            });
            if (changed) {
                this.onChange(compilation);
                compilation.rebuildModule(main, () => {
                });
            }


        });
        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            this.contextDependencies.forEach((item) => {
                if (fs.existsSync(item)) {
                    compilation.contextDependencies.add(item);
                }

            });
            this.fileDependencies.forEach(item => compilation.fileDependencies.add(item));
        });
    }
}
