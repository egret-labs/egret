import { HTMLAudioInstance } from './HTMLAudioInstance';
import { AbstractAudioLoader } from './index';

export class SimpleHTMLAudioLoader extends AbstractAudioLoader {

    static instanceClass = HTMLAudioInstance;

    load(url: string) {
        return new Promise<HTMLAudioElement>((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            const canplaythroughFunc = () => {
                audio.removeEventListener('canplaythrough', canplaythroughFunc);
                resolve(audio);
            }
            audio.addEventListener('canplaythrough', canplaythroughFunc);
            audio.load();
        });
    }
}
