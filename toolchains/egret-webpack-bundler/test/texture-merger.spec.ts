import * as path from 'path';
import * as bundler from './test-bundler';
const projectRoot = path.join(__dirname, 'simple-project');

describe('TextureMerger', () => {

    it('测试纹理合并', async () => {
        const { compilation } = await bundler.compile(projectRoot, { assets: [{ file: 'resource/default.res.json', executeBundle: true }], typescript: { mode: 'legacy' }, libraryType: 'debug' });
        const defaultResConfig = compilation.assets['resource/default.res.json'].source();
        const json = JSON.parse(defaultResConfig);
    });
});
