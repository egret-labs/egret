import { timer } from 'rxjs';
import { delay, delayWhen, retryWhen, tap } from 'rxjs/operators';
import { getLoader } from './processors';
import { getCache, getStore, initStore } from './store';
import { ResourceConfigFile, ResourceInfo } from './typings';

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
        // retryWhen((errors) => errors.pipe(
        //     // 输出错误信息
        //     tap(console.log),
        //     delay(100))),
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

type Configure = {
    maxRetry: number;
}

let globalConfig: Configure;

export function configure(config: { maxRetry: number }) {
    globalConfig = config;
}