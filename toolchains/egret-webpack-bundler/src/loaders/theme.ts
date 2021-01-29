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
        const dirs = this.options[0].dirs.map((dir) => path.join(compiler.context, dir));
        this.addFileDependency(path.join(compiler.context, theme.filePath));
        for (let dir of dirs) {
            this.addContextDependency(dir);
        }

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

    onChange(compilation: webpack.Compilation) {
        const compiler = compilation.compiler;
        const euiCompiler = new EuiCompiler(compiler.context, 'debug');

        const theme = euiCompiler.getThemes()[0];
        const themeFile = path.join(compiler.context, theme.filePath)
        if (utils.fileChanged(compiler, themeFile)) {
            const result = euiCompiler.emit();
            const filename = path.join(compiler.context, result[0].filename);
            const content = result[0].content;
            fs.writeFileSync(filename, content, 'utf-8');
        }

    }
}

