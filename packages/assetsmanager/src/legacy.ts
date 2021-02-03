import { merge } from 'rxjs';
import { map, mergeAll, scan } from 'rxjs/operators';
import { getResourceInfo as getResourceInfo_, getResourceWithSubkey, initConfig, load } from '.';
import { getLoader } from './processors';
import { getCache, getStore } from './store';
import { ResourceInfo } from './typings';

export namespace RES {

    export const getResourceInfo = getResourceInfo_;

    /**
     * 资源组的加载进度提示
     * @deprecated
     */
    export interface PromiseTaskReporter {

        /**
         * 进度回调，异步执行，加载数目和顺序无关
         * @param current 当前已经加载数目
         * @param total 当前资源包内需要资源总数
         * @param resItem 当前加载资源信息
         */
        onProgress?(current: number, total: number, resItem: ResourceInfo | undefined): void;
    }

    /**
     * @deprecated
     */
    export function loadGroup(groupName: string, priority?: number, reporter?: PromiseTaskReporter) {

        function emitReporter(current: number, v: ResourceInfo) {
            current += 1;
            if (reporter && reporter.onProgress) {
                reporter.onProgress(current, resourceNames.length, v);
            }
            return current;
        }

        const store = getStore();
        const resourceNames = store.config.groups[groupName];
        if (resourceNames) {
            const resources = resourceNames.map((resourceName) => store.config.resources[resourceName]);
            const loaders = resources.map(load);
            return merge(loaders).pipe(
                mergeAll(maxLoadingThread),
                scan(emitReporter, 0)
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

        // const [r, key, subkey] = getResourceWithSubkey(name);
        // const loader = getLoader(r.type);
        // if (p && p.getData && subkey) {
        //     return p.getData(RES.host, r, key, subkey);
        // }
        // else {
        //     return RES.host.get(r);
        // }
        return getCache()[name];
    }

    /**
     * @deprecated
     */
    export function getResAsync(name: string, callback?: Function, thisObject?: any) {
        const resource = getResourceInfo(name);
        const promise = load(resource).toPromise();
        if (callback) {
            return promise.then((v) => {
                callback.call(thisObject, v);
                return v;
            });
        }
        else {
            return promise;
        }
    }

    /**
     * @deprecated
     */
    export function hasRes(key: string) {
        return !!getStore().config.resources[key];
    }

    /**
     * @deprecated
     */
    export function getResByUrl(url: string, listener: Function, thisObject: any, type: string) {
        const resource = { url, name: url, type };
        const subsciption = load(resource).pipe(
        ).subscribe((v) => {
            listener(v);
            subsciption.unsubscribe();
        });
    }

    /**
     * @deprecated
     */
    export function getGroupByName(name: string) {
        const store = getStore();
        const resourceNames = store.config.groups[name];
        if (resourceNames) {
            return resourceNames;
        }
        throw new Error('missing groupName ' + name);
    }

    /**
     * @deprecated
     */
    export function createGroup(name: string, keys: string[], override: boolean = false) {
        if (override === void 0) {
            override = false;
        };
        const store = getStore();
        if ((!override && store.config.groups[name]) || !keys || keys.length == 0) {
            return false;
        }
        let group: string[] = [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (store.config.groups[key]) {
                const groupInfo = store.config.groups[key];
                group = group.concat(groupInfo);
            }
            else {
                group.push(key);
            }
        }
        store.config.groups[name] = group;
        return true;
    }

    const maxLoadingThread = 4;

    const eventDispatcher = new egret.EventDispatcher();

    /**
     * @deprecated
     */
    export function addEventListener(type: string, listener: Function, thisObject: any) {
        eventDispatcher.addEventListener(type, listener, thisObject);
    }

    /**
     * @deprecated
     */
    export function removeEventListener(type: string, listener: Function, thisObject: any) {
        eventDispatcher.removeEventListener(type, listener, thisObject);
    }

    /**
     * @deprecated
     */
    // eslint-disable-next-line no-inner-declarations
    function dispatchEvent(event: ResourceEvent) {
        eventDispatcher.dispatch(event);
    }

    export class ResourceEvent extends egret.Event {

        static ITEM_LOAD_ERROR = 'itemLoadError';

        // eslint-disable-next-line no-useless-constructor
        constructor(type: string) {
            super(type);
        }
    }

    /**
     * @deprecated
     */
    export namespace ResourceItem {

        /**
         * XML 文件。
         * @deprecated
         */
        export const TYPE_XML = 'xml';

        /**
         * 图片文件。
         * @deprecated
         */
        export const TYPE_IMAGE = 'image';

        /**
         * 二进制文件。
         * @deprecated
         */
        export const TYPE_BIN = 'bin';
        /**
         * 文本文件。
         * @deprecated
         */
        export const TYPE_TEXT = 'text';

        /**
         * JSON 文件。
         * @deprecated
         */
        export const TYPE_JSON = 'json';

        /**
         * SpriteSheet 文件。
         * @deprecated
         */
        export const TYPE_SHEET = 'sheet';

        /**
         * BitmapTextSpriteSheet 文件。
         * @deprecated
         */
        export const TYPE_FONT = 'font';

        /**
         * 声音文件。
         * @deprecated
         */
        export const TYPE_SOUND = 'sound';

        /**
         * TTF字体文件。
         * @deprecated
         */
        export const TYPE_TTF = 'ttf';
    }

}