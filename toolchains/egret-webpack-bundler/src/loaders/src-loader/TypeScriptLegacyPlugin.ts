
import * as path from 'path';
import * as webpack from 'webpack';
import { LineEmitter } from '../inline-loader';
import { AbstractInlinePlugin } from '../inline-loader/AbstractInlinePlugin';
import * as utils from '../utils';
import { Factory } from './Factory';


export class TypeScriptLegacyPlugin extends AbstractInlinePlugin {

    private factory!: Factory;

    createLineEmitter(compiler: webpack.Compiler) {
        this.addContextDependency(path.join(compiler.context, 'src'));
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

    onChange(compilation: webpack.Compilation) {
        this.factory.fs = compilation.compiler.inputFileSystem as any;
        this.factory.update();
    }
}
