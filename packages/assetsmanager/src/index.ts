import { delay, retryWhen, scan, tap } from 'rxjs/operators';
import { getProcessor } from './processors';
import { getCache, getStore, initStore } from './store';
import { ResourceConfigFile, ResourceInfo } from './typings';

export function destory() {
    initStore();
}

export function initConfig(resourceRoot: string, c: ResourceConfigFile) {
    const store = getStore();
    const config = store.config;
    for (const r of c.resources) {
        config.resources[r.name] = r;
        if (resourceRoot.lastIndexOf('/') !== resourceRoot.length - 1) {
            resourceRoot += '/';
        }
        r.url = resourceRoot + r.url;
        if (r.subkeys) {
            const subkeys = r.subkeys.split(',');
            for (const subkey of subkeys) {
                config.alias[subkey] = `${r.name}.${subkey}`;
            }
        }
    }
    for (const g of c.groups) {
        config.groups[g.name] = g.keys.split(',');
    }
    return config;
}

export function load(resource: ResourceInfo) {
    return getProcessor(resource.type).onLoadStart(resource).pipe(
        retryWhen((errors) => errors.pipe(
            scan((acc, curr) => {
                if (acc > 2) {
                    throw curr;
                }
                return acc + 1;
            }, 1),
            delay(100))),
        tap((v) => getCache()[resource.name] = v)
    );
}

export function getResourceWithSubkey(key: string): [ResourceInfo, string?, string?] {
    const config = getStore().config;
    const alias = config.alias[key];
    if (alias) {
        const temp = alias.split('.');
        const [mainkey, subkey] = temp;
        const result = getResourceInfo(mainkey);
        return [result, key, subkey];
    }
    else {
        return [getResourceInfo(key)];
    }
}

export function getResourceInfo(key: string) {
    const config = getStore().config;
    const result = config.resources[key];
    if (!result) {
        throw new Error('error res name ' + key);
    };
    return result;
}

type Configure = {
    maxRetry: number;
}

let globalConfig: Configure;

export function configure(config: { maxRetry: number }) {
    globalConfig = config;
}