#!/usr/bin/env node
//@ts-check
const lib = require('../lib/index');
const args = require('args');
const path = require('path');
args.option('config', 'config-file', '', (value) => {
    if (!value) {
        return null;
    }
    else {
        const p = path.join(process.cwd(), value);
        // eslint-disable-next-line global-require
        return require(p);
    }

});
args.command('build', 'build-project', (name, sub, options) => {
    // @ts-ignore
    const config = options.config;
    const bundler = new lib.EgretWebpackBundler(process.cwd(), 'web');
    bundler.build(config);
});
args.command('prepare', 'prepare-build-project', (name, sub, options) => {
    // @ts-ignore
    const bundler = new lib.EgretWebpackBundler(process.cwd(), 'web');
    bundler.install();
});
args.command('run', 'run-project', (name, sub, options) => {
    // @ts-ignore
    const config = options.config;
    const bundler = new lib.EgretWebpackBundler(process.cwd(), 'web');
    bundler.startDevServer(config);
});
args.command('publish', 'run-project', (name, sub, options) => {
    // @ts-ignore
    const config = options.config;
    const bundler = new lib.EgretWebpackBundler(process.cwd(), 'web');
    bundler.build(config);
});
args.parse(process.argv);