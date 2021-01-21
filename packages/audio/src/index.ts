interface AudioConfig {

    name: string,
    type: string,
    url: string
}

interface InternalAudioConfig extends AudioConfig {

    data?: any;

    loaderClass: LoaderClass
}

type LoaderClass = { new(): AbstractAudioLoader } & { instanceClass: any }

export class AudioManager {

    private store: {
        [name: string]: InternalAudioConfig
    } = {};

    static context: AudioContext;

    constructor() {
        AudioManager.context = new AudioContext();
    }

    private factories: { [name: string]: AudioFactory } = {};

    private getInternalConfig(name: string) {
        const internalConfig = this.store[name];
        if (!internalConfig) {
            throw new Error('error');
        }
        return internalConfig;
    }

    register(config: AudioConfig, loaderClass: LoaderClass) {
        this.store[config.name] = Object.assign(config, { loaderClass: loaderClass });
    }

    getFactory(name: string) {
        if (!this.factories[name]) {
            const internalConfig = this.getInternalConfig(name);
            this.factories[name] = new AudioFactory(internalConfig);
        }
        return this.factories[name];
    }
}

export abstract class AbstractAudioInstance {

    protected loader: any;

    play() {
    }
}

export class AudioFactory {

    private config: InternalAudioConfig;

    constructor(config: InternalAudioConfig) {
        this.config = config;
    }

    load() {
        const loader = new this.config.loaderClass;
        return loader.load(this.config.url).then((value) => {
            this.config.data = value;
        });
    }

    create() {
        const instance = new this.config.loaderClass.instanceClass(this.config.data);
        return instance;
    }

}

export abstract class AbstractAudioLoader {

    abstract load(url: string): Promise<any>

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

export class SimpleHTMLAudioLoader extends AbstractAudioLoader {

    static instanceClass = HTMLAudioInstance;

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