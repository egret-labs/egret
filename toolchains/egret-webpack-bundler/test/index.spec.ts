import * as path from 'path';
import * as bundler from './test-bundler';
const projectRoot = path.join(__dirname, 'simple-project');

describe('第一个测试', () => {

    it('测试 egret.is', async () => {
        const { store } = await bundler.compile(projectRoot, { typescript: { mode: 'legacy' }, libraryType: 'debug' });
        const context = {} as any;
        const mainJs = store.readFileSync('test/simple-project/dist/main.js', 'utf-8').toString();
        bundler.runInContext(mainJs, context);
        expect(egret.is(new context.MyComponent(), 'MyComponent')).toBe(true);
        expect(egret.is(new context.MyComponent(), 'InterfaceA')).toBe(true);
        expect(egret.is(new context.MyComponent(), 'm.InterfaceB')).toBe(true);

    });

    it('测试全局变量', async () => {

        const { store, compiler } = await bundler.compile(projectRoot, { typescript: { mode: 'legacy' }, libraryType: 'debug' });
        const context = {} as any;
        const mainJs = store.readFileSync('test/simple-project/dist/main.js', 'utf-8').toString();
        bundler.runInContext(mainJs, context);
        expect(context.doSomething).not.toBeUndefined();
        expect(context.m).not.toBeUndefined();

    });

    it('测试 manifest', async () => {
        const { store, compilation } = await bundler.compile(projectRoot, { parseEgretProperty: true, typescript: { mode: 'legacy' }, libraryType: 'debug' });
        // console.log(store.readdirSync('.'))
        // console.log(compilation.errors)
        // const manifestContent = store.readFileSync('test/simple-project/dist/manifest.json', 'utf-8').toString();
        // const manifest = JSON.parse(manifestContent);
        // expect(manifest).toEqual(
        //     {
        //         initial: [
        //             'libs/modules/egret/egret.js',
        //             'libs/modules/egret/egret.web.js',
        //             'libs/modules/eui/eui.js',
        //             'libs/modules/assetsmanager/assetsmanager.js'
        //         ],
        //         game: [
        //             'main.js'
        //         ]
        //     });
        // expect(compilation.errors.length).toEqual(4);
    });
});

const egret = {

    is: (instance: any, typeName: string) => {
        if (!instance || typeof instance != 'object') {
            return false;
        }
        const prototype = Object.getPrototypeOf(instance);
        const types = prototype ? prototype.__types__ : null;
        if (!types) {
            return false;
        }
        return (types.indexOf(typeName) !== -1);
    }
};
