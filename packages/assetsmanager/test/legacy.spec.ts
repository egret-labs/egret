import { assert } from 'chai';
import { Server } from 'http';
import Koa from 'koa';
import koaStatic from 'koa-simple-static';
import { describe, it } from 'mocha';
import { destory, initConfig } from '../src';
import * as RES from '../src/legacy';
import { egretMock } from './egret-mock';

egretMock();
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

describe('legacy-api', () => {

    it('has', () => {
        initConfig('', createConfig());
        const has = RES.hasRes('1_jpg');
        assert.isTrue(has, '配置文件中包含1_jpg');
    });
    it('has not', () => {
        initConfig('', createConfig());
        const has = RES.hasRes('2_jpg');
        assert.isFalse(has, '配置文件中不包含2_jpg');
    });

    before(() => {
        server = app.listen(3000);
    });
    after(() => {

        server.close();
    });
    afterEach(() => {
        destory();
    });
    it('check-url', () => {
        initConfig('http://localhost', createConfig());
        const resource = RES.getResourceInfo('1_jpg');
        assert.equal(resource.url, 'http://localhost/1.jpg');
    });
    it('check-url-2', () => {
        initConfig('http://localhost/', createConfig());
        const resource = RES.getResourceInfo('1_jpg');
        assert.equal(resource.url, 'http://localhost/1.jpg');
    });
    it('load-resource-config-file', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        const result = await RES.getResAsync('1_json');
        assert.deepEqual({ name: 'egret' }, result);
    });
    it('load-image', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        await RES.getResAsync('1_jpg');
    });
    it('load-group', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        await RES.loadGroup('preload');
        const json = RES.getRes('1_json');
        assert.deepEqual(json, { name: 'egret' }, 'load-json-success');
        const texture = RES.getRes('1_jpg');
        assert.ok(texture, 'load-texture-success');
    });
    it('get-group-byName', async () => {
        await RES.loadConfig("default.res.json", "http://localhost:3000/static");
        const result = await RES.getGroupByName("preload");
        assert.deepEqual(result, ['1_jpg', '1_json'], 'get-group-byName-success');
    });
});
