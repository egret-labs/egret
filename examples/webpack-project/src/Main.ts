import { RES } from '@egret/assetsmanager/dist/legacy';
import { AudioFactory, WebAudioInstance } from '@egret/audio';
import * as eui from '@egret/eui';
import { Tween } from '@egret/tween';
class Main extends egret.DisplayObjectContainer {

    constructor() {
        super();



        console.log(i18n.name);
        // this.run();
        this.runTween();
        this.runEui();


    }

    async run() {
        await RES.loadConfig('default.res.json', 'resource');
        const audioFactory = await RES.getResAsync("bg_mp3") as AudioFactory<WebAudioInstance>;
        const audio = audioFactory.create();
        audio.play();
    }

    async runTween() {

        const label = new eui.Label();
        label.x = label.y = 100;
        label.text = 'helloworld';
        this.addChild(label)

        const text = new egret.TextField();
        text.text = "Hello,World";
        text.x = text.y = 50;
        this.addChild(text)
        Tween.get(text).to({ x: 400, y: 400 }, 1000)
    }


    async runEui() {
        console.log(111)
        console.log(222)
        const context = eui.Context.getInstance();
        context.getTheme = async () => { generateEUI };
        context.initialize();


    }
}


declare var generateEUI: any;