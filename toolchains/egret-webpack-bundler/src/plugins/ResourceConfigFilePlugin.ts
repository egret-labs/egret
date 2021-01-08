import * as webpack from 'webpack';
import { WebpackBundleOptions } from '..';
import { createProject } from '../egretproject';
import * as path from 'path';
import { json } from 'express';

export default class ResourceConfigFilePlugin {

    // eslint-disable-next-line no-useless-constructor
    constructor(private options: { files: string[] }) {

    }

    public apply(compiler: webpack.Compiler) {

        function readFileAsync(filePath: string): Promise<Buffer> {
            return new Promise((resolve, reject) => {
                compiler.inputFileSystem.readFile(filePath, (error, content) => {
                    if (error) {
                        reject(new Error(`文件访问异常:${filePath}`));
                    }
                    else {
                        resolve(content);
                    }
                });
            });
        }

        const pluginName = this.constructor.name;
        compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {
            const assets = compilation.assets;
            const filepath = path.join(compiler.context, this.options.files[0]).split('\\').join('/');
            try {
                const content = await readFileAsync(filepath);
                const json = parseConfig(filepath, content.toString());
                validConfig(json);
                updateAssets(assets, filepath, content);
            }
            catch (e) {
                const message = `\t资源配置处理异常\n\t${e.message}`;
                compilation.errors.push({ file: filepath, message });
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

function parseConfig(filename: string, raw: string): ResourceConfigFile {
    try {
        const json = JSON.parse(raw);
        return json;
    }
    catch (e) {
        throw new Error(`${filename}不是合法的JSON文件`);
    }
}

function validConfig(config: ResourceConfigFile) {
    const groups = config.groups;
    const resources: { [name: string]: ResourceConfigFile['resources'][0] } = {};
    for (const r of config.resources) {
        resources[r.name] = r;
    }
    for (const group of groups) {
        const keys = group.keys.split(',');
        for (const key of keys) {
            if (!resources[key]) {
                throw new Error(`资源配置组${group.name}中包含了不存在的资源名${key}`);
            }
        }
    }
}

type ResourceConfigFile = Parameters<typeof import('../../../../packages/assetsmanager')['initConfig']>[1];
