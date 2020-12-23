declare namespace egret {

    export class ImageLoader {
        load(url: string): void;
        addEventListener(type: string, listener: Function, thisObject: any);
        data: BitmapData
    }

    export class Texture {
        _setBitmapData(bitmapData: BitmapData): void;
    }

    export interface BitmapData {
        width: number,
        height: number,
        source: any
    }

    export class BitmapFont {

        constructor(texture: Texture, config: any)
    }

    export class Event {

        type: string;

        constructor(type: string)
    }

    export class EventDispatcher {

        addEventListener(type: string, listener: Function, thisObject: any): void;
        removeEventListener(type: string, listener: Function, thisObject: any): void
        dispatch(event: Event): void;
    }
}