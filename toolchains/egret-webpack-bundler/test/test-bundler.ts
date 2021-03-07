import { Volume } from 'memfs';
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
    return new Promise<{ store: InstanceType<typeof Volume>, compiler: webpack.Compiler, compilation: webpack.Compilation, report: Function }>((resolve, reject) => {
        const webpackConfig = lib.generateConfig(projectRoot, options, 'web', false);
        let compilation: webpack.Compilation;
        const compiler = webpack(webpackConfig);
        const store = new Volume();

        const handler = (error: any, status: any) => {
            console.log(error)
            console.log(status.toString(webpackConfig.stats))
            resolve({ store, compiler, compilation, report: () => console.log(status.toString(webpackConfig.stats)) });
        };
        compiler.outputFileSystem = store as any;
        compiler.hooks.thisCompilation.tap('test', (_c) => {
            compilation = _c;
        });
        compiler.run(handler);
    });

}