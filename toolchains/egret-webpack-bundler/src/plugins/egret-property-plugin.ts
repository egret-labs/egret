import * as webpack from 'webpack';
import { WebpackBundleOptions } from '..';
import { getLibsFileList } from '../egretproject';

export default class EgretPropertyPlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: WebpackBundleOptions) {

    }

    public apply(compiler: webpack.Compiler) {

        const pluginName = this.constructor.name;
        compiler.hooks.emit.tap(pluginName, (compilation) => {
            const scripts = getLibsFileList('web', compiler.context, this.options.libraryType);
            const manifest = { initial: scripts, game: ['main.js'] };
            const manifestContent = JSON.stringify(manifest, null, '\t');
            const assets = compilation.assets;
            updateAssets(assets, 'manifest.json', manifestContent);
            for (const script of manifest.initial) {
                updateAssets(assets, script, compiler.inputFileSystem.readFileSync(script));
            }
        });
    }
}

function updateAssets(assets: any, filePath: string, content: string | Buffer) {

    assets[filePath] = {
        source: () => content,
        size: () => ((typeof content === 'string') ? content.length : content.byteLength)
    };
}
