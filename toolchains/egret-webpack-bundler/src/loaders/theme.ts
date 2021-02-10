import { EuiCompiler } from '@egret/eui-compiler';
import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import { createProject } from '../egretproject';
import { LineEmitter } from './inline-loader';
import { AbstractInlinePlugin } from './inline-loader/AbstractInlinePlugin';

type ThemePluginOptions = {
    dirs: string[],
    output: 'inline' | 'standalone'
}

export default class ThemePlugin extends AbstractInlinePlugin {
    private options: Required<ThemePluginOptions>;

    constructor() {
        super();
        this.options = {
            dirs: [],
            output: 'inline'
        };
    }

    createLineEmitter(compiler: webpack.Compiler) {
        const euiCompiler = new EuiCompiler(compiler.context);

        const project = createProject(compiler.context);
        const exmls = project.getExmlRoots();
        this.options.dirs = exmls;

        const theme = euiCompiler.getThemes()[0];
        const dirs = this.options.dirs.map((dir) => path.join(compiler.context, dir));
        if (theme.data.autoGenerateExmlsList) {
            addWatchIgnore(compiler, path.join(compiler.context, theme.filePath));
        }
        else {
            this.addFileDependency(path.join(compiler.context, theme.filePath));
        }
        for (let dir of dirs) {
            this.addContextDependency(dir);
        }
        return {
            emitLines: () => {
                const euiCompiler = new EuiCompiler(compiler.context);
                const theme = euiCompiler.getThemes()[0];
                const requires = theme.data.exmls.map((exml) => `require("./${path.relative(path.join(compiler.context, 'src'), exml).split('\\').join('/')}");`);
                const themeJsContent = [
                    `var eui = require('@egret/eui')`,
                    `window.eui = eui`,
                    `window.skins = window.skins || {};`,
                    `window.generateEUI = window.generateEUI || {`,
                    `   paths: {},styles: undefined,`,
                    `   skins: ${JSON.stringify(theme.data.skins, null)},`,
                    `};`,

                ].concat(requires).concat([
                    `module.exports = window.generateEUI;`
                ]);
                return themeJsContent
            }
        } as LineEmitter
    }

    onChange(compilation: webpack.Compilation) {
        const compiler = compilation.compiler;
        const euiCompiler = new EuiCompiler(compiler.context, 'debug');
        // const theme = euiCompiler.getThemes()[0];
        // const themeFile = path.join(compiler.context, theme.filePath)
        const result = euiCompiler.emit();
        const filename = path.join(compiler.context, result[0].filename);
        const content = result[0].content;
        fs.writeFileSync(filename, content, 'utf-8');
    }
}



// 添加watch ignore
function addWatchIgnore(compiler: webpack.Compiler, ignored: string) {
    const options = compiler.options as webpack.Configuration & { devServer: any };
    const watchOptions = options.watchOptions ||
        (options.devServer && options.devServer.watchOptions) ||
        {};

    if (!watchOptions.ignored) {
        watchOptions.ignored = [];
    } else if (!Array.isArray(watchOptions.ignored)) {
        watchOptions.ignored = [watchOptions.ignored];
    }
    watchOptions.ignored.push(ignored);

    options.watchOptions = watchOptions;
    // options.devServer.watchOptions = watchOptions;
}