import { RES } from '@egret/assetsmanager/dist/legacy';
import { AudioFactory, WebAudioInstance } from '@egret/audio';
import * as eui from '@egret/eui';
import { Tween } from '@egret/tween';
class Main extends egret.DisplayObjectContainer {

    constructor() {
        super();



        console.log(i18n.name);
        // this.run();
        this.execute();


    }

    async execute() {

        await this.runEui();
        await this.runTween();
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
        label.text = 'hello,world';
        this.addChild(label)

        const text = new egret.TextField();
        text.text = "Hello,World";
        text.x = text.y = 50;
        this.addChild(text)
        Tween.get(text).to({ x: 400, y: 400 }, 1000)
        const x = { zIndex: 1 } as { zIndex: number }
        Tween.get(this).to({ b: 1 });
    }


    async runEui() {

        const context = eui.Context.getInstance();
        context.getTheme = async () => generateEUI;
        context.getAssets = async (source) => RES.getResAsync(source)
        context.initialize();

        await RES.loadConfig('default.res.json', 'resource');
        const img = new eui.Image();
        img.source = 'bg_jpg';
        this.addChild(img);


        const component = new eui.Component();
        component.skinName = skins.MyComponent;
        this.addChild(component);
        component.x = component.y = 200;

    }
}


declare var generateEUI: any;