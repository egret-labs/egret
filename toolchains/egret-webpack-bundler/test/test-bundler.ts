import * as lib from '../';
import * as vm from 'vm';

export function compile(projectRoot: string, context: any) {

    const bundler = new lib.EgretWebpackBundler(projectRoot, 'web');
    const store = {} as any;
    bundler.emitter = (filename: string, data: any) => {
        store[filename] = data;
    };

    return bundler.build({ libraryType: 'debug', typescript: { mode: 'legacy' } }).then(() => {
        const mainJsContent = store['main.js'].toString();
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
    });
}