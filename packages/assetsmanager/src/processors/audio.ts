import { AbstractAudioLoader, AudioManager, SimpleHTMLAudioLoader, WebAudioInstance } from '@egret/audio';
import { Observable } from 'rxjs';
import { loadBuffer, Processor } from '../processors';

export const soundEffectProcessor: Processor = {
    onLoadStart: (resource) => {
        return new Observable((s) => {
            const manager = AudioManager.instance;
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
    }
}

export const musicProcessor: Processor = {
    onLoadStart: (resource) => {
        return new Observable((s) => {
            const manager = AudioManager.instance;
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
    }
}

class WebAudioLoader extends AbstractAudioLoader {

    static instanceClass = WebAudioInstance;

    async load(url: string): Promise<AudioBuffer> {

        const buffer = await loadBuffer(url).toPromise();
        const audioContext: AudioContext = AudioManager.context;
        return audioContext.decodeAudioData(buffer).then((decodeData) => {
            return decodeData;
        });
    }
}