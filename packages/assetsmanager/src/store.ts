import { Store } from './typings';

let store: Store = {
    config: { resources: {}, groups: {}, alias: {} }
};

let cache: { [name: string]: any } = {};

export function getStore() {
    return store;
}

export function getCache() {
    return cache;
}

export function initStore() {
    store = { config: { resources: {}, groups: {}, alias: {} } };
    cache = {};
}