import * as path from 'path';
import * as webpack from 'webpack';
import { WebpackBundleOptions } from '..';
import { getLibsFileList } from '../egretproject';
import { CachedFile } from '../loaders/file';
import * as utils from '../loaders/utils';

export default class EgretPropertyPlugin {

    private thmJS!: CachedFile;

    constructor(private options: WebpackBundleOptions) {

    }

    public apply(compiler: webpack.Compiler) {

        const manifestPath = path.join(compiler.context, 'manifest.json');
        this.thmJS = new CachedFile(manifestPath, compiler);

        // const pluginName = this.constructor.name;
        // const beforeRun = async (_compiler: webpack.Compiler, callback: Function) => {
        // };
        // compiler.hooks.beforeRun.tapAsync(pluginName, beforeRun);

        const scripts = getLibsFileList('web', compiler.context, this.options.libraryType);
        const manifestContent = JSON.stringify(
            { initial: scripts, game: ['main.js'] }, null, '\t'
        );
        this.thmJS.update(manifestContent);
        // 更新文件系统缓存状态
        utils.updateFileTimestamps(compiler, this.thmJS.filePath);
    }
}
