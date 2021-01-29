
import * as path from 'path';
import * as webpack from 'webpack';
import { LineEmitter } from '../inline-loader';
import { AbstractInlinePlugin } from '../inline-loader/AbstractInlinePlugin';
import * as utils from '../utils';
import { Factory } from './Factory';


export class TypeScriptLegacyPlugin extends AbstractInlinePlugin {

    private factory!: Factory;

    createLineEmitter(compiler: webpack.Compiler) {

        this.factory = new Factory({ context: compiler.context });

        const emitter: LineEmitter = {
            emitLines: () => {
                const d = this.factory.sortUnmodules();
                const dependenciesRequires: string[] = [];
                d.forEach((fileName) => {
                    const resourcePath = path.join(compiler.context, "src/Main.ts");
                    if (fileName !== resourcePath) {
                        const relative = utils.relative(resourcePath, fileName);
                        dependenciesRequires.push(`require('${relative}');`);
                    }
                });
                return dependenciesRequires;
            }
        }
        return emitter;
    }

    onThisCompilation(compilation: webpack.Compilation) {
        this.factory.fs = compilation.compiler.inputFileSystem as any;
        this.factory.update();
    }

    public apply(compiler: webpack.Compiler) {
        super.apply(compiler);

        const pluginName = this.constructor.name;
        const dirs = ['src'].map((dir) => path.join(compiler.context, dir));

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            dirs.forEach((item) => {
                compilation.contextDependencies.add(item);
            });
        });
    }
}
