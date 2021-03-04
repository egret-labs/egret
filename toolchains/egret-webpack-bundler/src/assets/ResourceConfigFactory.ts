import * as webpack from 'webpack';

export type ResourceConfigFile = Parameters<typeof import('../../../../packages/assetsmanager/dist')['initConfig']>[1];

export type ResourceConfig = ResourceConfigFile['resources'][0] & {
    isEmitted?: boolean
}

export class ResourceConfigFactory {

    compilation!: webpack.Compilation;

    config: ResourceConfigFile = { groups: [], resources: [] };

    parse(filename: string, raw: string) {
        let json: ResourceConfigFile;
        try {
            json = JSON.parse(raw);
        }
        catch (e) {
            throw new Error(`${filename}不是合法的JSON文件`);
        }
        this.validConfig(json);
        this.config = JSON.parse(JSON.stringify(json));

    }

    removeResource(name: string) {
        const index = this.config.resources.findIndex((r) => r.name === name);
        if (index >= 0) {
            this.config.resources.splice(index, 1);
        }
    }

    addResource(config: ResourceConfig) {
        config.isEmitted = true;
        this.config.resources.push(config);
    }

    private validConfig(config: ResourceConfigFile) {
        const groups = config.groups;
        const resources: { [name: string]: ResourceConfigFile['resources'][0]; } = {};
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

    emitConfig() {
        for (const r of this.config.resources as ResourceConfig[]) {
            delete r.isEmitted;
        }
        const content = JSON.stringify(this.config);
        return content;
    }

}