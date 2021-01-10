import { EuiCompiler } from '@egret/eui-compiler';
import * as path from 'path';
import * as webpack from 'webpack';
import { CachedFile } from './file';
import * as utils from './utils';

interface ThemePluginOptions {
    dirs?: string[];
}

export default class ThemePlugin {
    private options: Required<ThemePluginOptions>;

    constructor(options: ThemePluginOptions) {
        this.options = {
            dirs: ['resource/eui_skins', 'resource/skins'], // 扫描目录
            ...options
        };
    }

    private errors!: any[];
    private compiler!: webpack.Compiler;
    private thmJS!: CachedFile;

    public apply(compiler: webpack.Compiler) {

        this.errors = [];
        this.compiler = compiler;
        const dirs = this.options.dirs.map((dir) => path.join(compiler.context, dir));
        const pluginName = this.constructor.name;
        const euiCompiler = new EuiCompiler(compiler.context);
        const theme = euiCompiler.getThemes()[0];
        const outputFilename = theme.filePath.replace('.thm.json', '.thm.js');
        const thmJSPath = path.join(compiler.context, outputFilename);
        utils.addWatchIgnore(compiler, thmJSPath);
        this.thmJS = new CachedFile(thmJSPath, compiler);

        // if (this.options.thmJSON) {
        //     const thmJSONPath = path.join(compiler.context, this.options.thmJSON);
        //     utils.addWatchIgnore(compiler, thmJSONPath);
        //     // this.thmJSON = new FileCacheWriter(thmJSONPath);
        // }

        // if (this.options.exmlDeclare) {
        // const exmlDeclarePath = path.join(compiler.context, this.options.exmlDeclare);
        // utils.addWatchIgnore(compiler, exmlDeclarePath);
        // this.exmlDeclare = new FileCacheWriter(exmlDeclarePath);
        // }

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

                // eslint-disable-next-line global-require
                const fs = require('fs');
                const filename = path.join(this.compiler.context, result[0].filename);
                const content = result[0].content;

                fs.writeFileSync(filename, content, 'utf-8');
                // 更新文件系统缓存状态

                const inlineLoaderRule: webpack.RuleSetRule = {
                    test: /Main\.ts/,
                    include: path.join(compilr.context!, 'src'),
                    loader: require.resolve('./inline-loader'),
                    options: { content: themeJsContent }
                };

                compiler.options.module?.rules.push(inlineLoaderRule);
            }
            catch (error) {
                // // 写入错误信息
                this.errors.push(error);
            }

        };

        compiler.hooks.thisCompilation.tap(pluginName, (compilation: webpack.compilation.Compilation) => {
            if (this.errors.length) {
                compilation.errors.push(...this.errors);
            }
        });

        compiler.hooks.watchRun.tapPromise(pluginName, beforeRun);
        compiler.hooks.beforeRun.tapPromise(pluginName, beforeRun);

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            dirs.forEach((item) => {
                compilation.contextDependencies.add(item);
            });
        });
    }
}

