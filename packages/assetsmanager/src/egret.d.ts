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
}