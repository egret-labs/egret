import { AbstractAudioLoader, AudioManager, SimpleHTMLAudioLoader, WebAudioInstance } from '@egret/audio';
import { Observable } from 'rxjs';
import { loadBuffer, Processor } from '../processors';

export const soundEffectProcessor: Processor = (resource) => {
    return new Observable((s) => {
        const manager = new AudioManager();
        manager.register(resource, SimpleHTMLAudioLoader);
        const factory = manager.getFactory(resource.name);
        factory.load().then(() => {
            s.next(factory);
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
        const factory = manager.getFactory(resource.name);
        factory.load().then(() => {
            s.next(factory);
            s.complete();
        }
        ).catch(function (error) {
            s.error(error);
        });
    });
};

class WebAudioLoader extends AbstractAudioLoader {

    static instanceClass = WebAudioInstance;

    async load(url: string): Promise<AudioBuffer> {

        const buffer = await loadBuffer(url).toPromise();
        return new Promise<AudioBuffer>((resolve, reject) => {
            AudioManager.context.decodeAudioData(buffer, function (decodeData) {
                resolve(decodeData);
            });
        });
    }
}