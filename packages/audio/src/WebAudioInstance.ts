import { AbstractAudioInstance } from './index';
import { AudioManager } from './AudioManager';

export class WebAudioInstance extends AbstractAudioInstance {

    // private gainNode: GainNode;
    private source: AudioBufferSourceNode;
    constructor(buffer: AudioBuffer) {
        super();
        // this.gainNode = context.createGain();
        const source = AudioManager.context.createBufferSource();
        source.buffer = buffer;
        this.source = source;

    }

    play() {
        this.source.start();
    }

}
