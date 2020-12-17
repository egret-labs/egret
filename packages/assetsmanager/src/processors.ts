///<reference path="egret.d.ts"/>
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResourceInfo } from './typings';



export type Processor = (resource: ResourceInfo) => Observable<any>

const textProcessor: Processor = (resource) => createHttp(resource.url)

const jsonProcessor: Processor = (resource) => getLoader('text')(resource).pipe(
    map((v) => JSON.parse(v))
)

const bitmapdataProcessor: Processor = (resource) => createImage(resource.url);

const textureProcessor: Processor = (resource) => getLoader('bitmapdata')(resource).pipe(
    map(bitmapData => {
        var texture = new egret.Texture();
        texture._setBitmapData(bitmapData);
        return texture;
        // if (resource.scale9grid) {
        //     var list = r.scale9grid.split(",");
        //     texture["scale9Grid"] = new egret.Rectangle(parseInt(list[0]), parseInt(list[1]), parseInt(list[2]), parseInt(list[3]));
        // }
    })
)

export const loaders: { [type: string]: (resource: ResourceInfo) => Observable<any> } = {
    text: textProcessor,
    json: jsonProcessor,
    bitmapdata: bitmapdataProcessor,
    image: textureProcessor
}

export function getLoader(type: string) {
    const loader = loaders[type];
    if (!loader) {
        throw new Error('missing type ' + type)
    }
    return loader;
}


export function createImage(url: string) {

    return new Observable<egret.BitmapData>((s) => {
        var loader = new egret.ImageLoader();
        loader.load(url);
        loader.addEventListener('complete', () => {
            const bitmapData = loader.data;
            s.next(bitmapData);
            s.complete();
        }, loader);
    })
}

export function createHttp(url: string) {
    return new Observable<string>(subscribe => {
        const xhr = new XMLHttpRequest();
        xhr.open('get', url);
        xhr.onerror = (error) => {
            subscribe.error('error')
        }
        xhr.onload = (event) => {
            if (xhr.status >= 400) {
                subscribe.error('error')
            }
            else {
                subscribe.next(xhr.responseText);
                subscribe.complete();
            }
        }
        xhr.send()
    })
}