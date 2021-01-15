interface AudioConfig {

    name: string,
    type: string,
    url: string
}

interface InternalAudioConfig extends AudioConfig {

    data?: any;
}

export class AudioManager {

    private loaderClass: { new(): AbstractAudioLoader } = SimpleHTMLAudioLoader;

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

    register(config: AudioConfig) {
        this.store[config.name] = config;
    }

    registerLoader(loader: { new(): AbstractAudioLoader }) {
        this.loaderClass = loader;
    }

    load(name: string) {
        const internalConfig = this.getInternalConfig(name);
        const loader = new this.loaderClass();
        return loader.load(internalConfig.url).then((value) => {
            internalConfig.data = value;
        });
    }
}

export abstract class AbstractAudioInstance {

    protected loader: any;

    // eslint-disable-next-line no-useless-constructor
    constructor(private audio: HTMLAudioElement) {

    }

    play() {
        this.audio.play();
    }
}

export abstract class AbstractAudioLoader {

    abstract load(url: string): Promise<AbstractAudioInstance>
}

class SimpleHTMLAudioLoader extends AbstractAudioLoader {

    load(url: string) {
        return new Promise<AbstractAudioInstance>((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.addEventListener('canplaythrough', () => {
                const instance = new HTMLAudioInstance(audio);
                resolve(instance);
            });
            audio.load();
        });
    }
}

export class HTMLAudioInstance extends AbstractAudioInstance {

    play() {

    }
}