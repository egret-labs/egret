import { merge } from 'rxjs';
import { map, mergeAll, tap } from 'rxjs/operators';
import { getLoader } from './processors';
import { getCache, getStore, initStore } from './store';
import { ResourceConfig, ResourceConfigFile, ResourceInfo } from './typings';

export function destory() {
    initStore();
}

export function initConfig(resourceRoot: string, config: ResourceConfigFile) {
    const store = getStore();
    for (const r of config.resources) {
        store.config.resources[r.name] = r;
        if (resourceRoot.lastIndexOf('/') !== resourceRoot.length - 1) {
            resourceRoot += '/';
        }
        r.url = resourceRoot + r.url;
    }
    for (const g of config.groups) {
        store.config.groups[g.name] = g.keys.split(',');
    }
    return store.config;
}

export function load(resource: ResourceInfo) {
    return getLoader(resource.type)(resource).pipe(
        tap((v) => getCache()[resource.name] = v)
    );
}

export function getResourceInfo(key: string) {
    const result = getStore().config.resources[key];
    if (!result) {
        throw new Error('error res name');
    };
    return result;
}