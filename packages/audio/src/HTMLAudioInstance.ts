import { AbstractAudioInstance } from './index';

export class HTMLAudioInstance extends AbstractAudioInstance {

    private audio: HTMLAudioElement;

    constructor(audio: HTMLAudioElement) {
        super();
        this.audio = audio;
    }

    play() {
        this.audio.play();
    }

    mute(value: boolean) {
        this.audio.muted = value;
    }
}
