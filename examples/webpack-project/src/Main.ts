import { RES } from '@egret/assetsmanager/dist/legacy'
import { AudioFactory, WebAudioInstance } from '@egret/audio';

class Main extends egret.DisplayObject {

    constructor() {
        super();
        console.log(i18n.name);
        this.run();


    }

    async run() {
        await RES.loadConfig('default.res.json', 'resource');
        const audioFactory = await RES.getResAsync("bg_mp3") as AudioFactory<WebAudioInstance>;
        const audio = audioFactory.create();
        audio.play();
    }
}
