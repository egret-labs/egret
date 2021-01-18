import * as path from 'path';
import * as bundler from './test-bundler';
const projectRoot = path.join(__dirname, 'simple-project');

describe('ResourceConfigPlugin', () => {

    it('测试 missing.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: [{ file: 'resource/missing.res.json', executeBundle: true }], typescript: { mode: 'legacy' }, libraryType: 'debug' });

        expect(compilation.errors.length).toEqual(1);

    });

    it('测试 invalid.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: [{ file: 'resource/invalid.res.json' }], typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(1);

    });

    it('测试 error.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: [{ file: 'resource/error.res.json' }], typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(1);

    });

    it('测试 error-url.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: [{ file: 'resource/error-url.res.json', executeBundle: true }], typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(1);
    });

    it('测试 default.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: [{ file: 'resource/default.res.json' }], typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(0);
        const defaultResConfig = compilation.assets['resource/default.res.json'].source();
        expect(defaultResConfig).not.toBeUndefined();
    });
});
