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
    private dirs!: string[];
    private thmJS!: CachedFile;

    private buildTimestamp = 0;

    public apply(compiler: webpack.Compiler) {

        this.errors = [];
        this.compiler = compiler;
        this.dirs = this.options.dirs.map((dir) => path.join(compiler.context, dir));
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

        const requires = theme.data.exmls.map((exml) => `require("./${path.relative(path.dirname(theme.filePath), exml).split('\\').join('/')}");`);
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
        const beforeRun = async (_compiler: webpack.Compiler, callback: Function) => {
            this.errors = [];
            try {
                const euiCompiler = new EuiCompiler(compiler.context, 'debug');
                const result = euiCompiler.emit();

                // eslint-disable-next-line global-require
                const fs = require('fs');
                const filename = path.join(this.compiler.context, result[0].filename);
                const content = result[0].content;

                fs.writeFileSync(filename, content, 'utf-8');
                this.thmJS.update(utils.generateContent(themeJsContent));
                // 更新文件系统缓存状态
                utils.updateFileTimestamps(this.compiler, this.thmJS.filePath);
                callback();
            }
            catch (error) {
                // // 写入错误信息
                this.errors.push(error);
                callback();
            }

        };

        compiler.hooks.thisCompilation.tap(pluginName, (compilation: webpack.compilation.Compilation) => {
            if (this.errors.length) {
                compilation.errors.push(...this.errors);
            }
        });

        compiler.hooks.watchRun.tapAsync(pluginName, beforeRun);
        compiler.hooks.beforeRun.tapAsync(pluginName, beforeRun);

        // this.thmJS.update(utils.generateContent(content));

        // // 更新文件系统缓存状态
        // utils.updateFileTimestamps(this.compiler, this.thmJS.filePath);

        // 扩展
        // compiler.hooks.themePluginResult = new SyncHook(['themeResult']);

        // const beforeRun = async (_compiler, callback) => {
        //     if (this.needRebuild(compiler.contextTimestamps)) {
        //         this.ret = await this.make(); // cached ret

        //         this.generateThmJS(this.ret);
        //         this.thmJSON && this.generateThmJSON(this.ret);
        //         this.exmlDeclare && this.generateExmlDeclare(this.ret);

        //         this.buildTimestamp = Date.now();
        //     }

        //     // invoke themePluginResult
        //     compiler.hooks.themePluginResult.call(this.ret);
        //     callback();
        // };

        // compiler.hooks.watchRun.tapAsync(pluginName, beforeRun);
        // compiler.hooks.beforeRun.tapAsync(pluginName, beforeRun);

        // 监听文件目录
        compiler.hooks.afterCompile.tap(pluginName, (compilation) => {
            this.dirs.forEach((item) => {
                compilation.contextDependencies.add(item);
            });
        });
    }
}
