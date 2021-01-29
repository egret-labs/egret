import { AbstractAudioInstance } from './AbstractAudioInstance';

export class HTMLAudioInstance extends AbstractAudioInstance {

    private audio: HTMLAudioElement;

    constructor(audio: HTMLAudioElement) {
        super();
        this.audio = audio;
    }

    play() {
        const audio = this.audio;
        audio.volume = 1;
        audio.currentTime = 0;
        audio.play();
    }

    stop() {
        const audio = this.audio;
        audio.pause();
        try {
            audio.currentTime = 0;
        } catch (e) {
        }
    }

    mute(value: boolean) {
        this.audio.muted = value;
    }

    loop(value: boolean) {
        this.audio.loop = value;
    }
}
