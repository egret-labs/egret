import * as path from 'path';
import * as bundler from './test-bundler';
const projectRoot = path.join(__dirname, 'simple-project');

describe('ResourceConfigPlugin', () => {

    it('测试 missing.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: { files: ['resource/missing.res.json'] }, typescript: { mode: 'legacy' }, libraryType: 'debug' });

        expect(compilation.errors.length).toEqual(1);

    });

    it('测试 invalid.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: { files: ['resource/invalid.res.json'] }, typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(1);

    });

    it('测试 error.res.json', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: { files: ['resource/error.res.json'] }, typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(1);

    });

    it('测试 default.res.json', async () => {
        const { store, compilation, report } = await bundler.compile(projectRoot, { assets: { files: ['resource/default.res.json'] }, typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(0);
        const absolutePath = path.join(projectRoot, 'resource/default.res.json').split('\\').join('/');
        const defaultResConfig = compilation.assets[absolutePath].source();
        expect(defaultResConfig).not.toBeUndefined();

    });
});

