interface AudioConfig {

    name: string,
    type: string,
    url: string
}

interface InternalAudioConfig extends AudioConfig {

    data?: any;

    loaderClass: { new(): AbstractAudioLoader }
}

export class AudioManager {

    private store: {
        [name: string]: InternalAudioConfig
    } = {};

    getInstance(name: string) {
        const internalConfig = this.getInternalConfig(name);
        if (internalConfig.data) {
            return new HTMLAudioInstance(internalConfig.data);
        }
        else {
            throw new Error('error');
        }
    }

    private getInternalConfig(name: string) {
        const internalConfig = this.store[name];
        if (!internalConfig) {
            throw new Error('error');
        }
        return internalConfig;
    }

    register(config: AudioConfig, loaderClass: { new(): AbstractAudioLoader }) {
        this.store[config.name] = Object.assign(config, { loaderClass: loaderClass });
    }

    load(name: string) {
        const internalConfig = this.getInternalConfig(name);
        const loader = new internalConfig.loaderClass;
        return loader.load(internalConfig.url).then((value) => {
            internalConfig.data = value;
        });
    }
}

export abstract class AbstractAudioInstance {

    protected loader: any;

    play() {
    }
}

export abstract class AbstractAudioLoader {

    abstract load(url: string): Promise<any>

}

export class SimpleHTMLAudioLoader extends AbstractAudioLoader {

    load(url: string) {
        return new Promise<HTMLAudioElement>((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.addEventListener('canplaythrough', () => {
                resolve(audio);
            });
            audio.load();
        });
    }
}

export class HTMLAudioInstance extends AbstractAudioInstance {

    private audio: HTMLAudioElement;

    constructor(audio: HTMLAudioElement) {
        super();
        this.audio = audio;
    }

    play() {
        this.audio.play();
    }
}

const context = new AudioContext();

export class WebAudioInstance extends AbstractAudioInstance {

    // private gainNode: GainNode;
    private source: AudioBufferSourceNode;
    constructor(buffer: AudioBuffer) {
        super();
        // this.gainNode = context.createGain();
        const source = context.createBufferSource();
        source.buffer = buffer;
        this.source = source;

    }

    play() {
        this.source.start();
    }

}