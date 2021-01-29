import { AudioManager } from './AudioManager';
import { AbstractAudioInstance } from './AbstractAudioInstance';

export class WebAudioInstance extends AbstractAudioInstance {

    private gainNode: GainNode;
    private source: AudioBufferSourceNode;
    constructor(buffer: AudioBuffer) {
        super();
        const context = AudioManager.context;
        this.gainNode = context.createGain();
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);
        this.gainNode.connect(context.destination);
        this.source = source;

    }

    play() {
        this.source.start();
    }

    mute(value: boolean) {
        this.gainNode.gain.value = value ? 1 : 0;
    }

    loop(value: boolean) {

    }

}
