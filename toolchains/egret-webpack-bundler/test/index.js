//@ts-check
const { describe, it } = require('mocha');
const path = require('path');
const projectRoot = path.join(__dirname, 'simple-project');
const assert = require('assert')



describe('第一个测试', () => {

    it('测试 egret.is', () => {
        const bundler = require('./test-bundler');
        const context = {};
        return bundler.compile(projectRoot, context).then(() => {
            assert.equal(egret.is(new context.MyComponent(), 'MyComponent'), true, '检查成功');
            assert.equal(egret.is(new context.MyComponent(), 'InterfaceA'), true, '检查成功');
            assert.equal(egret.is(new context.MyComponent(), 'm.InterfaceB'), true, '检查成功');
        });

    })

    it('测试全局变量', () => {
        const bundler = require('./test-bundler');
        const context = {};
        return bundler.compile(projectRoot, context).then(() => {
            // @ts-ignore
            assert.ok(context.doSomething, 'Main.ts -> function doSomething() 应该挂载至 window 上');
            // @ts-ignore
            assert.ok(context.m, 'Main.ts -> namespace m 应该挂载至 window 上');
        });

    })
})


const egret = {

    is: (instance, typeName) => {
        if (!instance || typeof instance != "object") {
            return false;
        }
        var prototype = Object.getPrototypeOf(instance);
        var types = prototype ? prototype.__types__ : null;
        if (!types) {
            return false;
        }
        return (types.indexOf(typeName) !== -1);
    }
}
