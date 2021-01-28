import { EuiCompiler } from '@egret/eui-compiler';
import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import * as utils from './utils';

type ThemePluginOptions = {
    dirs: string[],
    output: 'inline' | 'standalone'
}[]

export default class ThemePlugin {
    private options: Required<ThemePluginOptions>;
    private isFirst = true;

    constructor() {
        this.options = [{
            dirs: ['resource/eui_skins', 'resource/skins'],
            output: 'inline'
        }];
    }

    private errors!: any[];
    private compiler!: webpack.Compiler;

    public apply(compiler: webpack.Compiler) {

        this.errors = [];
        this.compiler = compiler;
        const dirs = this.options[0].dirs.map((dir) => path.join(compiler.context, dir));
        const pluginName = this.constructor.name;
        const euiCompiler = new EuiCompiler(compiler.context);
        const theme = euiCompiler.getThemes()[0];
        const outputFilename = theme.filePath.replace('.thm.json', '.thm.js');
        const thmJSPath = path.join(compiler.context, outputFilename);
        utils.addWatchIgnore(compiler, thmJSPath);

        const requires = theme.data.exmls.map((exml) => `require("./${path.relative(path.join(compiler.context, 'src'), exml).split('\\').join('/')}");`);
        const themeJsContent = `window.skins = window.skins || {};
    window.generateEUI = window.generateEUI || {
      paths: {},
      styles: undefined,
      skins: ${JSON.stringify(theme.data.skins, null, '\t')},
    };
    ${requires.join('\n')}
    module.exports = window.generateEUI;
    `;

        //   if (utils.isHot(this.compiler)) {
        //     content += '\nif (module.hot) { module.hot.accept(); }';
        //   }
        const beforeRun = async (compilr: webpack.Compiler) => {

            this.errors = [];
            try {
                const euiCompiler = new EuiCompiler(compiler.context, 'debug');
                const result = euiCompiler.emit();
                const filename = path.join(this.compiler.context, result[0].filename);
                const content = result[0].content;

                fs.writeFileSync(filename, content, 'utf-8');
                // 更新文件系统缓存状态

                if (this.isFirst) {
                    const inlineLoaderRule: webpack.RuleSetRule = {
                        test: /Main\.ts/,
                        include: path.join(compilr.context!, 'src'),
                        loader: require.resolve('./inline-loader'),
                        options: { content: themeJsContent }
                    };

                    compiler.options.module?.rules.push(inlineLoaderRule);
                    this.isFirst = false;
                }
            }
            catch (error) {
                // // 写入错误信息
                this.errors.push(error);
            }

        };

        compiler.hooks.thisCompilation.tap(pluginName, (compilation: webpack.Compilation) => {
            if (this.errors.length) {
                compilation.errors.push(...this.errors);
            }
        });

        compiler.hooks.watchRun.tapPromise(pluginName, beforeRun);
        compiler.hooks.beforeRun.tapPromise(pluginName, beforeRun);

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            dirs.forEach((item) => {
                if (fs.existsSync(item)) {
                    compilation.contextDependencies.add(item);
                }
            });
        });
    }
}

