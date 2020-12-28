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
            const manifestContent = JSON.stringify(
                { initial: scripts, game: ['main.js'] }, null, '\t'
            );
            const assets = compilation.assets;
            assets['manifest.json'] = {
                source: () => manifestContent,
                size: () => manifestContent.length
            };
        });
    }
}
