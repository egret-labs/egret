import { merge } from 'rxjs';
import { map, mergeAll } from 'rxjs/operators';
import { getResourceInfo, initConfig, load } from '.';
import { getCache, getStore } from './store';
import { ResourceInfo } from './typings';

export { getResourceInfo } from '.';

/**
 * 资源组的加载进度提示
 * @deprecated
 * @version Egret 5.2
 * @language zh_CN
 */
export interface PromiseTaskReporter {
    /**
     * Progress callback, asynchronous execution, load number and order have nothing to do
     * @param current The number of currently loaded
     * @param total Total resources required in the current resource bundle
     * @param resItem currently loading resource information
     * @version Egret 5.2
     * @platform Web,Native
     * @language en_US
     */
    /**
     * 进度回调，异步执行，加载数目和顺序无关
     * @param current 当前已经加载数目
     * @param total 当前资源包内需要资源总数
     * @param resItem 当前加载资源信息
     * @version Egret 5.2
     * @platform Web,Native
     * @language zh_CN
     */
    onProgress?(current: number, total: number, resItem: ResourceInfo | undefined): void;
}

/**
 * @deprecated
 */
export function loadGroup(groupName: string, priority?: number, reporter?: PromiseTaskReporter) {
    const store = getStore();
    const resourceNames = store.config.groups[groupName];
    if (resourceNames) {
        const resources = resourceNames.map((resourceName) => store.config.resources[resourceName]);
        return merge(resources.map(load)).pipe(
            mergeAll(2)
        ).toPromise();
    }
    throw new Error('missing groupName ' + groupName);
}

/**
 * @deprecated
 */
export function loadConfig(configFileUrl: string, resourceRoot: string) {
    if (resourceRoot.lastIndexOf('/') !== resourceRoot.length - 1) {
        resourceRoot += '/';
    }
    const config = {
        name: configFileUrl,
        url: resourceRoot + configFileUrl,
        type: 'json'
    };
    return load(config).pipe(
        map((v) => initConfig(resourceRoot, v))
    ).toPromise();
}

/**
 * @deprecated
 */
export function getRes(name: string) {
    return getCache()[name];
}

/**
 * @deprecated
 */
export function getResAsync(name: string) {
    const resource = getResourceInfo(name);
    return load(resource).toPromise();
}

export function hasRes(key: string) {
    return !!getStore().config.resources[key];
}

export function getResByUrl(url: string, listener: Function, thisObject: any, type: string) {
    const resource = { url, name: url, type };
    const subsciption = load(resource).pipe(
    ).subscribe((v) => {
        listener(v);
        subsciption.unsubscribe();
    });
}

export function getGroupByName(name: string) {
    const store = getStore();
    const resourceNames = store.config.groups[name];
    if (resourceNames) {
        return resourceNames;
    }
    throw new Error('missing groupName ' + name);
}