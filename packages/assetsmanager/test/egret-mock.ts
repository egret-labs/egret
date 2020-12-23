///<reference path="../src/egret.d.ts"/>

class HTMLImageElement {

    onload!: Function;
    private $src: string = '';

    get src() {
        return this.$src;
    }

    set src(value: string) {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.open('get', value);
        xhr.onload = () => {
            this.onload();
        };
        xhr.send();
        this.$src = value;
    }
}

class ImageLoader {

    private listener!: Function;

    load(url: string) {
        const image = new HTMLImageElement();
        image.src = url;
        image.onload = () => {
            this.data = { width: 100, height: 100, source: image };
            this.listener();
        };
    }

    addEventListener(type: string, listener: Function, thisObject: any) {
        this.listener = listener;
    }

    data!: egret.BitmapData;
}

class Texture {

    bitmapData!: egret.BitmapData;

    _setBitmapData(bitmapData: egret.BitmapData) {
        this.bitmapData = bitmapData;
    }
}

class Event {

    // eslint-disable-next-line no-useless-constructor
    constructor(public type: string) {

    }

}

class EventDispatcher {

    addEventListener(type: string, listener: Function, thisObject: any): void {

    }
    removeEventListener(type: string, listener: Function, thisObject: any): void {

    }
    dispatch(event: Event): void {

    }
}

class BitmapFont {

    // eslint-disable-next-line no-useless-constructor
    constructor(texture: Texture, config: any) {

    }
}

export function egretMock() {
    global.egret = {
        ImageLoader,
        Texture,
        Event,
        EventDispatcher,
        BitmapFont
    };
}