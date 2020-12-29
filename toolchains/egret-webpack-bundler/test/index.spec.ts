import * as path from 'path';
import * as bundler from './test-bundler';
const projectRoot = path.join(__dirname, 'simple-project');

describe('第一个测试', () => {

    it('测试 egret.is', () => {
        const context = {} as any;
        return bundler.compile(projectRoot, context).then(() => {
            expect(egret.is(new context.MyComponent(), 'MyComponent')).toBe(true);
            expect(egret.is(new context.MyComponent(), 'InterfaceA')).toBe(true);
            expect(egret.is(new context.MyComponent(), 'm.InterfaceB')).toBe(true);
        });

    });

    it('测试全局变量', () => {
        const context = {} as any;
        return bundler.compile(projectRoot, context).then(() => {
            expect(context.doSomething).not.toBeUndefined();
            expect(context.m).not.toBeUndefined();
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
