///<reference path="egret.d.ts"/>
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { getResourceInfo } from '.';
import { musicProcessor, soundEffectProcessor } from './processors/audio';
import { getStore } from './store';
import { ResourceInfo } from './typings';

export type Processor = {
    onLoadStart: (resource: ResourceInfo) => Observable<any>

    getData?(host: { get: (resource: ResourceInfo) => any }, resource: ResourceInfo, key: string, subkey: string): any
}

const textProcessor: Processor = {
    onLoadStart: (resource) => createHttp(resource.url)
}

const jsonProcessor: Processor = {
    onLoadStart: (resource) => getProcessor('text').onLoadStart(resource).pipe(
        map((v) => JSON.parse(v)))

};

const bitmapdataProcessor: Processor = {
    onLoadStart: (resource) => createImage(resource.url)
}

const textureProcessor: Processor = {
    onLoadStart: (resource) => getProcessor('bitmapdata').onLoadStart(resource).pipe(
        map((bitmapData) => {
            const texture = new egret.Texture();
            texture._setBitmapData(bitmapData);
            return texture;
            // if (resource.scale9grid) {
            //     var list = r.scale9grid.split(",");
            //     texture["scale9Grid"] = new egret.Rectangle(parseInt(list[0]), parseInt(list[1]), parseInt(list[2]), parseInt(list[3]));
            // }
        })
    )
}

// return host.load(resource, 'text').then(function (data) {
//     var config;
//     try {
//         config = JSON.parse(data);
//     }
//     catch (e) {
//         config = data;
//     }
//     var imageName;
//     if (typeof config === 'string') {
//         imageName = fontGetTexturePath(resource.url, config);
//     }
//     else {
//         imageName = getRelativePath(resource.url, config.file);
//     }
//     var r = host.resourceConfig.getResource(RES.nameSelector(imageName));
//     if (!r) {
//         r = { name: imageName, url: imageName, type: 'image', root: resource.root };
//     }
//     // var texture: egret.Texture = await host.load(r);
//     return host.load(r).then(function (texture) {
//         var font = new egret.BitmapFont(texture, config);
//         font["$resourceInfo"] = r;
//         // todo refactor
//         host.save(r, texture);
//         return font;
//     }, function (e) {
//         host.remove(r);
//         throw e;
//     });
// });
function convertToJson<T>(data: string | T): T {
    if (typeof data === 'string') {
        return JSON.parse(data);
    }
    else {
        return data;
    }
}

function getRelativePath(url: string, file: string) {
    if (file.indexOf('://') != -1) {
        return file;
    }
    url = url.split('\\').join('/');
    const params = url.match(/#.*|\?.*/);
    let paramUrl = '';
    if (params) {
        paramUrl = params[0];
    }
    const index = url.lastIndexOf('/');
    if (index != -1) {
        url = url.substring(0, index + 1) + file;
    }
    else {
        url = file;
    }
    return url + paramUrl;
}

const nameSelector = (url: string) => {
    const x = url.split('/').pop()!;
    return x.split('.').join('_');
};

type FontJson = {
    file: string,
    frames: {
        [index: string]: { x: number, y: number, w: number, h: number, offX: number, offY: number, sourceW: number, sourceH: number }[]
    }
}

const fontProcessor: Processor = {
    onLoadStart: (resource) => getProcessor('text').onLoadStart(resource).pipe(
        map((data) => convertToJson<FontJson>(data)),
        mergeMap((config) => {
            const imageUrl = getRelativePath(resource.url, config.file);
            const imageName = nameSelector(imageUrl);
            const hasRes = !!getStore().config.resources[imageName];
            const r = hasRes ? getResourceInfo(imageName) : { name: imageUrl, url: imageUrl, type: 'image' };
            return forkJoin([of(config), getProcessor('image').onLoadStart(r)]);
        }),
        map((v) => {
            const [config, texture] = v;
            const font = new egret.BitmapFont(texture, config);
            return font;
        })
    )
}

const spriteSheetProcessor: Processor = {
    onLoadStart: (resource) => getProcessor('json').onLoadStart(resource).pipe(
        mergeMap((data) => {
            const imageUrl = getRelativePath(resource.url, data.file);
            const imageName = nameSelector(imageUrl);
            const hasRes = !!getStore().config.resources[imageName];
            const r = hasRes ? getResourceInfo(imageName) : { name: imageName, url: imageUrl, type: 'image' };
            return forkJoin([of(data), getProcessor('image').onLoadStart(r), of(r)]);
        }),
        map((v) => {
            const [data, bitmapData, r] = v;
            const frames = data.frames;
            const spriteSheet = new egret.SpriteSheet(bitmapData);
            spriteSheet.$resourceInfo = r;
            for (const subkey in frames) {
                const config = frames[subkey];
                const texture = spriteSheet.createTexture(subkey, config.x, config.y, config.w, config.h, config.offX, config.offY, config.sourceW, config.sourceH);
                // if (config.scale9grid) {
                //     const str = config.scale9grid;
                //     const list = str.split(',');
                //     texture.scale9Grid = new egret.Rectangle(parseInt(list[0]), parseInt(list[1]), parseInt(list[2]), parseInt(list[3]));
                // }
            }
            // host.save(r, bitmapData);
            return spriteSheet;
        })
    ),
    getData(host, resource, key, subkey) {
        const spritesheet = host.get(resource) as egret.SpriteSheet;
        return spritesheet.getTexture(subkey);

    }
}

export const loaders: { [type: string]: Processor } = {
    text: textProcessor,
    json: jsonProcessor,
    bitmapdata: bitmapdataProcessor,
    image: textureProcessor,
    font: fontProcessor,
    sheet: spriteSheetProcessor,
    music: musicProcessor,
    soundeffect: soundEffectProcessor
};

export function getProcessor(type: string): Processor
export function getProcessor(type: string) {
    const loader = loaders[type];
    if (!loader) {
        throw new Error('missing type ' + type);
    }
    return loader;
}

export function createImage(url: string) {

    return new Observable<egret.BitmapData>((s) => {
        const loader = new egret.ImageLoader();
        loader.load(url);
        loader.addEventListener('complete', () => {
            const bitmapData = loader.data;
            s.next(bitmapData);
            s.complete();
        }, loader);
    });
}

export function createHttp(url: string) {
    return new Observable<string>((subscribe) => {
        const xhr = new XMLHttpRequest();
        xhr.open('get', url);
        xhr.onerror = (error) => {
            subscribe.error(new Error('error'));
        };
        xhr.onload = (event) => {
            if (xhr.status >= 400) {
                subscribe.error(new Error('error'));
            }
            else {
                subscribe.next(xhr.responseText);
                subscribe.complete();
            }
        };
        xhr.send();
    });
}

export function loadBuffer(url: string) {
    return new Observable<ArrayBuffer>((subscribe) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.open('get', url);
        xhr.onerror = (error) => {
            subscribe.error(new Error('error'));
        };
        xhr.onload = (event) => {
            if (xhr.status >= 400) {
                subscribe.error(new Error('error'));
            }
            else {
                subscribe.next(xhr.response);
                subscribe.complete();
            }
        };
        xhr.send();
    });
}