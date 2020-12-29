import * as path from 'path';
import * as bundler from './test-bundler';
const projectRoot = path.join(__dirname, 'simple-project');

describe('ResourceConfigPlugin', () => {

    it('测试 default.res.json', async () => {
        const { store, compilation, report } = await bundler.compile(projectRoot, { emitResource: true, typescript: { mode: 'legacy' }, libraryType: 'debug' });
        expect(compilation.errors.length).toEqual(1);

    });
});

