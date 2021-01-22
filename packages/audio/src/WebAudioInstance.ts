import { AudioManager } from './AudioManager';
import { AbstractAudioInstance } from './index';

export class WebAudioInstance extends AbstractAudioInstance {

    // private gainNode: GainNode;
    private source: AudioBufferSourceNode;
    constructor(buffer: AudioBuffer) {
        super();
        // this.gainNode = context.createGain();
        const source = AudioManager.context.createBufferSource();
        source.buffer = buffer;
        source.connect(AudioManager.context.destination);
        this.source = source;

    }

    play() {
        this.source.start();
    }

    mute(value: boolean) {

    }

    loop(value: boolean) {

    }

}
