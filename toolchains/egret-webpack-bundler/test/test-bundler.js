//@ts-check
const lib = require('../');
const path = require('path');
const { fstat } = require('fs');

module.exports.compile = function compile(projectRoot, context) {

    const bundler = new lib.EgretWebpackBundler(projectRoot, 'web');
    let store = {};
    bundler.emitter = (filename, data) => {
        console.log(filename)
        store[filename] = data;
    }

    return bundler.build({ libraryType: "debug", typescript: { mode: "legacy" } }).then(() => {
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
        const vm = require('vm');
        const script = new vm.Script(code);
        script.runInNewContext(context, { displayErrors: true });
        return context;
    })
}