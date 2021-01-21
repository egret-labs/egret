import { Observable } from 'rxjs';
import { AbstractAudioInstance, AbstractAudioLoader, AudioManager, SimpleHTMLAudioLoader, WebAudioInstance } from '@egret/audio';
import { createHttp, loadBuffer, Processor } from '../processors';

export const soundEffectProcessor: Processor = (resource) => {
    return new Observable((s) => {
        const manager = new AudioManager();
        manager.register(resource, SimpleHTMLAudioLoader);
        manager.load(resource.name).then(() => {
            s.next(manager);
            s.complete();
        }
        ).catch(function (error) {
            s.error(error);
        });
    });
};

export const musicProcessor: Processor = (resource) => {
    return new Observable((s) => {
        const manager = new AudioManager();
        manager.register(resource, WebAudioLoader);
        manager.load(resource.name).then(() => {
            s.next(manager);
            s.complete();
        }
        ).catch(function (error) {
            s.error(error);
        });
    });
};

class WebAudioLoader extends AbstractAudioLoader {

    async load(url: string): Promise<AudioBuffer> {

        const buffer = await loadBuffer(url).toPromise();
        const context = new AudioContext();
        return new Promise<AudioBuffer>((resolve, reject) => {
            context.decodeAudioData(buffer, function (decodeData) {
                resolve(decodeData);
            });
        });
    }
}