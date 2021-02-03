global.AudioContext = class { } as any;

import { Server } from 'http';
import Koa from 'koa';
import koaStatic from 'koa-simple-static';
import { destory, initConfig } from '../src';
import { getStore } from '../src/store';
import { egretMock } from './egret-mock';
import { apply, clearHitCheck } from './server-hit-check';
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
        expect(has).toBe(true);
    });
    it('has not', () => {
        initConfig('', createConfig());
        const has = RES.hasRes('2_jpg');
        expect(has).toBe(false);
    });

    beforeAll(() => {
        server = app.listen(3001);
    });
    afterAll(() => {

        server.close();
    });
    afterEach(() => {
        clearHitCheck();
        destory();
    });
    it('check-url', () => {
        initConfig('http://localhost', createConfig());
        const resource = RES.getResourceInfo('1_jpg');
        expect(resource.url).toEqual('http://localhost/1.jpg');
    });
    it('check-url-2', () => {
        initConfig('http://localhost/', createConfig());
        const resource = RES.getResourceInfo('1_jpg');
        expect(resource.url).toEqual('http://localhost/1.jpg');
    });
    it('load-resource-config-file', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
        const result = await RES.getResAsync('1_json');
        expect(result).toEqual({ name: 'egret' });
    });
    it('load-404-config-file', async () => {
        const promise = RES.loadConfig('error.res.json', 'http://localhost:3001/static');
        expect(promise).rejects.toThrow();
    });
    describe('RES.getResAsync', () => {
        it('getResAsyncReturnType', async () => {
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            const texture = await RES.getResAsync('1_jpg');
            expect(texture).toBeInstanceOf(egret.Texture);
        });
        it('getResAsync.callback', async () => {
            const mockfn = jest.fn();
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            const texture = await RES.getResAsync('1_jpg', mockfn, {});
            expect(mockfn).toBeCalledWith(texture);
        });
    });

    describe('RES.loadGroup', () => {
        it('load-group', async () => {
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            await RES.loadGroup('preload');
            const result = await RES.getResAsync('1_json');
            expect(result).toEqual({ name: 'egret' });
            const texture = RES.getRes('1_jpg');
            expect(texture).toBeInstanceOf(egret.Texture);
        });
        it('load-group-reporter', async () => {
            let localCurrent = 0;
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            await RES.loadGroup('preload', 0, {
                onProgress: (current, total) => {
                    localCurrent++;
                    expect(total).toBe(2);
                    expect(current).toBe(localCurrent);
                }
            });
        });
        it('get-group-byName', async () => {
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            const result = await RES.getGroupByName('preload');
            expect(result).toEqual(['1_jpg', '1_json']);
        });
        it('load-group-with-error-key', async () => {
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            const result = await RES.loadGroup('errorgroup');
            console.log('1111111111111s');
        })
    });

    // it('get-group-retry', async () => {
    //     try {
    //         await RES.loadConfig('error.res.json', 'http://localhost:3001/static');
    //     }
    //     catch (e) {

    //     }
    //     const hitCount = getCount('/static/error.res.json');
    //     expect(hitCount).toBe(3);
    // });
    describe("create-group", () => {
        it('create-group-override', async () => {
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            await RES.createGroup('preload', ['1_jpg', '1_json', '1_txt'], true);
            expect(getStore().config.groups.preload).toEqual(['1_jpg', '1_json', '1_txt']);
        });
        it('create-group-without-override', async () => {
            await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
            await RES.createGroup('preload', ['1_jpg', '1_json', '1_txt'], false);
            expect(getStore().config.groups.preload).toEqual(['1_jpg', '1_json']);
        });
    })

    it('load-font', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
        const font = await RES.getResAsync('num2_fnt');
        expect(font).toBeInstanceOf(egret.BitmapFont);
    });
    it('load-spritesheet', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
        const sheet = await RES.getResAsync('spritesheet_json');
        expect(sheet).toBeInstanceOf(egret.SpriteSheet);
    });
    it('load-spritesheet-2', async () => {
        await RES.loadConfig('default.res.json', 'http://localhost:3001/static');
        const texture = await RES.getResAsync('rank_no1_png');
        expect(texture).toBeInstanceOf(egret.Texture);
    });
});

