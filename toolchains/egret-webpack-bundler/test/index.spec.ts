import * as path from 'path';
import { Factory } from '../src/loaders/src-loader/Factory';
import * as bundler from './test-bundler';
import * as fs from 'fs';
const projectRoot = path.join(__dirname, 'simple-project');

describe('第一个测试', () => {

    it('测试 egret.is', async () => {
        const { store } = await bundler.compile(projectRoot, { typescript: { mode: 'modern' }, libraryType: 'debug' });
        const context = {} as any;
        const mainJs = store.readFileSync('test/simple-project/dist/main.js', 'utf-8').toString();
        bundler.runInContext(mainJs, context);
        expect(egret.is(new context.MyComponent(), 'MyComponent')).toBe(true);
        expect(egret.is(new context.MyComponent(), 'InterfaceA')).toBe(true);
        expect(egret.is(new context.MyComponent(), 'm.InterfaceB')).toBe(true);
        expect(egret.is(new context.MyComponent(), 'm.InterfaceC')).toBe(true);

    });

    it('测试全局变量', async () => {

        const { store, compiler } = await bundler.compile(projectRoot, { typescript: { mode: 'modern' }, libraryType: 'debug' });
        const context = {} as any;
        const mainJs = store.readFileSync('test/simple-project/dist/main.js', 'utf-8').toString();
        bundler.runInContext(mainJs, context);
        expect(context.doSomething).not.toBeUndefined();
        expect(context.m).not.toBeUndefined();

    });

    // describe('测试 TypeScript', () => {
    //     it('测试 legacy', async () => {
    //         const factory = new Factory({ context: 'test/simple-project' });
    //         factory.update();
    //         const list = factory.sortUnmodules();
    //         const nodeFileIndex = list.findIndex((v) => v.includes('testcore/Node.ts'));
    //         const checkNodeFileIndex = list.findIndex((v) => v.includes('testcore/CheckNode.ts'));
    //         expect(nodeFileIndex).toBeLessThan(checkNodeFileIndex);
    //     }
    //     );
    // });

    describe('测试manifest', () => {
        it('测试不存在的模块', async () => {
            // const { compilation } = await bundler.compile(projectRoot, { parseEgretProperty: true, typescript: { mode: 'modern' }, libraryType: 'debug' });
            // expect(compilation.errors.length).toEqual(4);
        });
        it('测试存在的模块', async () => {
            // const { store } = await bundler.compile(projectRoot, { parseEgretProperty: true, typescript: { mode: 'legacy' }, libraryType: 'debug' });
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
        });
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
