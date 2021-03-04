import { AudioManager } from './AudioManager';
import { AbstractAudioInstance } from './AbstractAudioInstance';

export class WebAudioInstance extends AbstractAudioInstance {

    private gainNode: GainNode;

    private source: AudioBufferSourceNode;

    private $loop: boolean = false;

    constructor(buffer: AudioBuffer) {
        super();
        const context = AudioManager.context;
        this.gainNode = context.createGain();
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);
        this.source = source;
    }

    play() {
        this.source.connect(this.gainNode);
        this.source.start();
        this.source.onended = this.onPlayEnded;
    }

    mute(value: boolean) {
        this.gainNode.gain.value = value ? 1 : 0;
    }


    loop(value: boolean) {
        if (this.$loop !== value) {
            this.$loop = value;
        }
    }


    stop() {
        if (this.source) {
            this.source.stop(0);
            this.source.onended = null;
            this.source.disconnect();
        }
    }


    private onPlayEnded() {
        if (this.$loop) {
            this.play();
        } else {
            this.stop();
        }
    }


}
