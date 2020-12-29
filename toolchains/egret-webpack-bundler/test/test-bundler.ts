import * as path from 'path';
import * as vm from 'vm';
import webpack from 'webpack';
import * as lib from '../lib/index';

export function runInContext(mainJsContent: string, context: any) {
    context.console = console;
    const code = `
    var window = this;
    var __reflect = (this && this.__reflect) || function (p, c, t) {
        console.log(t)
        p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
    };
    ${mainJsContent}
    `;
    const script = new vm.Script(code);
    script.runInNewContext(context, { displayErrors: true });
    return context;
}

export function compile(projectRoot: string, options: lib.WebpackBundleOptions) {
    return new Promise<{ store: any, compiler: webpack.Compiler, compilation: webpack.compilation.Compilation, report: Function }>((resolve, reject) => {
        const webpackConfig = lib.generateConfig(projectRoot, options, 'web', false);
        let compilation: webpack.compilation.Compilation;
        const compiler = webpack(webpackConfig);
        const handler: webpack.Compiler.Handler = (error, status) => {

            resolve({ store, compiler, compilation, report: () => console.log(status.toString(webpackConfig.stats)) });
        };
        const store = {} as any;

        compiler.outputFileSystem = {

            mkdir: (path: string, callback: (err: Error | undefined | null) => void) => {
                callback(null);
            },
            mkdirp: (path: string, callback: (err: Error | undefined | null) => void) => {
                callback(null);
            },

            rmdir: (path: string, callback: (err: Error | undefined | null) => void) => {
                callback(null);
            },

            unlink: (path: string, callback: (err: Error | undefined | null) => void) => {
                callback(null);
            },
            join: path.join,

            writeFile: (p: string, data: any, callback: (err: Error | undefined | null) => void) => {
                const relativePath = path.relative(webpackConfig.output?.path!, p).split('\\').join('/');
                store[relativePath] = data;
                callback(null);
            }
        };
        compiler.hooks.thisCompilation.tap('test', (_c) => {
            compilation = _c;
        });
        compiler.run(handler);
    });

}