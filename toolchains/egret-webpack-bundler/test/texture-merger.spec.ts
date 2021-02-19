import * as path from 'path';
import * as bundler from './test-bundler';
const projectRoot = path.join(__dirname, 'simple-project');

describe('TextureMerger', () => {

    it('测试纹理合并', async () => {
        const { store, compilation } = await bundler.compile(projectRoot, { assets: [{ file: 'resource/default.res.json', executeBundle: true }], typescript: { mode: 'modern' }, libraryType: 'debug' });
        const defaultResConfig = store.readFileSync('test/simple-project/dist/resource/default.res.json').toString();
        const json = JSON.parse(defaultResConfig)
        expect(json.resources.find((v: { name: string; }) => v.name === 'rank_no1_png')).toEqual(undefined)
        expect(json.resources.find((v: { name: string; }) => v.name === 'spritesheet_json')).toBeTruthy()
    });
});
