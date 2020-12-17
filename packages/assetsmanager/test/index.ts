import { assert } from 'chai';
import { Server } from 'http';
import Koa from 'koa';
import koaStatic from 'koa-simple-static';
import { describe, it } from 'mocha';
import { tap } from 'rxjs/operators';
import { destory, getResourceInfo, initConfig, load } from '../src';
import { createHttp } from '../src/processors';

global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


const app = new Koa();
app.use(koaStatic({ dir: __dirname }));
let server: Server

function createConfig() {
    return {
        groups: [],
        resources: [
            {
                url: "1.jpg", type: "image", name: "1_jpg"
            },
            {
                url: "1.json", type: "json", name: "1_json"
            },
            {
                url: '1.json', type: "text", name: "1_txt"
            }
        ]
    }
}

describe('RES.config', () => {


})


describe('load', () => {

    before(() => {
        server = app.listen(3000);
    });
    after(() => {

        server.close();
    })
    afterEach(() => {
        destory()
    })
    it('load-text-success', () => {
        return createHttp('http://localhost:3000/index.ts').pipe(
            tap(v => assert.ok(true, '可以下载文件'))
        ).toPromise();
    });
    it('load-404-file', () => {
        return createHttp('http://localhost:3000/none-existed').pipe(
        ).toPromise().catch((error) => {
            assert.ok(error, '下载失败可以抛出异常')
        })
    })
    it('load-error-server', () => {
        return createHttp('http://localhost:3001/none-existed').pipe(
        ).toPromise().catch((error) => {
            assert.ok(error, '下载失败可以抛出异常')
        })
    });
    it('load-timeout', () => {
        //TODO
    })
    it('load-json-success', () => {
        initConfig('http://localhost:3000/static', createConfig());
        const r = getResourceInfo('1_json');
        return load(r).pipe(
            tap(v => assert.deepEqual(v, { name: "egret" }))
        ).toPromise();
    });
    it('load-text-success', () => {
        initConfig('http://localhost:3000/static', createConfig());
        const r = getResourceInfo('1_txt');
        return load(r).pipe(
            tap(v => assert.deepEqual({ name: 'egret' }, JSON.parse(v)))
        ).toPromise()
    });
})