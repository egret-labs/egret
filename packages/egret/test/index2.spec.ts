import 'jest-webgl-canvas-mock';
import { createEgretEnverionment } from './Factory';
global.egret = {};
require('./libs/modules/egret/egret.js');
require('./libs/modules/egret/egret.web.js');

describe('TextField', function () {

    it('.text1', async function () {

        class Main extends global.egret.DisplayObjectContainer {

            constructor() {
                super();
                const text = new egret.TextField();
                this.addChild(text);
                text.text = 'Wangze';
            }
        }
        const context = await createEgretEnverionment(Main);
        console.log(context.__getDrawCalls());

    });
});