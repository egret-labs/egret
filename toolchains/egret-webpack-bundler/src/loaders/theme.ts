import { EuiCompiler } from '@egret/eui-compiler';
import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import { LineEmitter } from './inline-loader';
import { AbstractInlinePlugin } from './inline-loader/AbstractInlinePlugin';
import * as utils from './utils';

type ThemePluginOptions = {
    dirs: string[],
    output: 'inline' | 'standalone'
}[]

export default class ThemePlugin extends AbstractInlinePlugin {
    private options: Required<ThemePluginOptions>;

    constructor() {
        super();
        this.options = [{
            dirs: ['resource/eui_skins', 'resource/skins'],
            output: 'inline'
        }];
    }

    createLineEmitter(compiler: webpack.Compiler) {
        const euiCompiler = new EuiCompiler(compiler.context);
        const theme = euiCompiler.getThemes()[0];
        const outputFilename = theme.filePath.replace('.thm.json', '.thm.js');
        const thmJSPath = path.join(compiler.context, outputFilename);
        utils.addWatchIgnore(compiler, thmJSPath);

        const requires = theme.data.exmls.map((exml) => `require("./${path.relative(path.join(compiler.context, 'src'), exml).split('\\').join('/')}");`);

        const themeJsContent = [
            `window.skins = window.skins || {};`,
            `window.generateEUI = window.generateEUI || {`,
            `   paths: {},styles: undefined,`,
            `   skins: ${JSON.stringify(theme.data.skins, null)},`,
            `};`,

        ].concat(requires).concat([
            `module.exports = window.generateEUI;`
        ]);
        return {
            emitLines: () => {
                return themeJsContent
            }
        } as LineEmitter
    }

    private errors!: any[];

    onThisCompilation() {

    }
    public apply(compiler: webpack.Compiler) {

        this.errors = [];
        super.apply(compiler);

        const pluginName = this.constructor.name;


        // compiler.hooks.thisCompilation.tap(pluginName, (compilation: webpack.Compilation) => {
        //     if (this.errors.length) {
        //         compilation.errors.push(...this.errors);
        //     }
        // });

        const dirs = this.options[0].dirs.map((dir) => path.join(compiler.context, dir));

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            dirs.forEach((item) => {
                if (fs.existsSync(item)) {
                    compilation.contextDependencies.add(item);
                }
            });
            compilation.fileDependencies.add(path.join(compiler.context, 'resource/default.thm.json'))
        });
    }
}

