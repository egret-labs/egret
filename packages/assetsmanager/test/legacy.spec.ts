
import { assert } from 'chai';
import { Server } from 'http';
import Koa from 'koa';
import koaStatic from 'koa-simple-static';
import { describe, it } from 'mocha';
import { destory, initConfig } from '../src';
import { getStore } from '../src/store';
import { egretMock } from './egret-mock';
import { apply, clearHitCheck, getCount } from './server-hit-check';
egretMock(); //TODO
const RES: typeof import('../src/legacy')['RES'] = require('../src/legacy').RES;

global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const app = new Koa();
apply(app);
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
        clearHitCheck();
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
    it('load-404-config-file', async () => {
        try {
            await RES.loadConfig('error.res.json', 'http://localhost:3000/static');
            assert.fail('加载失败不应继续');
        }
        catch (e) {
        }

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
    it('load-group-reporter', async () => {
        let localCurrent = 0;
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        await RES.loadGroup('preload', 0, {
            onProgress: (current, total) => {
                localCurrent++;
                assert.equal(total, 2);
                assert.equal(current, localCurrent);
            }
        });
    });
    it('get-group-byName', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        const result = await RES.getGroupByName('preload');
        assert.deepEqual(result, ['1_jpg', '1_json'], 'get-group-byName-success');
    });
    it('get-group-retry', async () => {
        try {
            await RES.loadConfig('error.res.json', 'http://localhost:3000/static');

        }
        catch (e) {

        }
        const hitCount = getCount('/static/error.res.json');
        assert.equal(hitCount, 3);
    });
    it('create-group-true', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        await RES.createGroup('preload', ['1_jpg', '1_json', '1_txt'], true);
        assert.deepEqual(getStore().config.groups, { preload: ['1_jpg', '1_json', '1_txt'] }, 'create-group-true-success');
    });
    it('create-group-false', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        await RES.createGroup('preload', ['1_jpg', '1_json', '1_txt'], false);
        assert.deepEqual(getStore().config.groups, { preload: ['1_jpg', '1_json'] }, 'create-group-false-success');
    });
    it('load-font', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3000/static');
        const font = await RES.getResAsync('num2_fnt');
        assert.isTrue(font instanceof egret.BitmapFont, 'font加载正确');
    });
});

