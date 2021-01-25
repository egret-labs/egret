global.AudioContext = class { } as any;

import { Server } from 'http';
import Koa from 'koa';
import koaStatic from 'koa-simple-static';
import { destory, getResourceInfo, initConfig, load } from '../src';
import { createHttp } from '../src/processors';

global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const app = new Koa();
app.use(koaStatic({ dir: __dirname }));
let server: Server;

function createConfig() {
    return {
        groups: [],
        resources: [
            {
                url: '1.jpg', type: 'image', name: '1_jpg'
            },
            {
                url: '1.json', type: 'json', name: '1_json'
            },
            {
                url: '1.json', type: 'text', name: '1_txt'
            }
        ]
    };
}

describe('RES.config', () => {

});

describe('load', () => {

    beforeAll(() => {
        server = app.listen(3000);
    });
    afterAll(() => {

        server.close();
    });
    afterEach(() => {
        destory();
    });
    it('load-text-success', async () => {
        await expect(
            createHttp('http://localhost:3000/index.spec.ts').toPromise()
        ).resolves.toContain('load-text-success');
    });
    it('load-404-file', async () => {

        const promise = createHttp('http://localhost:3000/none-existed').toPromise();
        await expect(promise).rejects.toThrow();
    });
    it('load-error-server', async () => {
        const promise = createHttp('http://localhost:3001/none-existed').toPromise();
        await expect(promise).rejects.toThrow();
    });
    // it('load-timeout', () => {
    //     // TODO
    // });
    it('load-json-success', async () => {
        initConfig('http://localhost:3000/static', createConfig());
        const r = getResourceInfo('1_json');
        const promise = load(r).toPromise();
        await expect(promise).resolves.toEqual({ name: 'egret' });
    });
    it('load-text-success', async () => {
        initConfig('http://localhost:3000/static', createConfig());
        const r = getResourceInfo('1_txt');
        const promise = load(r).toPromise();
        await expect(promise).resolves.toContain('name');
    });
});