interface AudioConfig {

    name: string,
    type: string,
    url: string
}

interface InternalAudioConfig extends AudioConfig {

    data?: any;
}

export class AudioManager {

    private store: {
        [name: string]: InternalAudioConfig
    } = {};

    getInstance(name: string) {
        const config = this.store[name];
        if (config.data) {
            return new HTMLAudioInstance();
        }
        else {
            throw new Error('error');
        }
    }

    register(config: AudioConfig) {
        this.store[config.name] = config;
    }

    load(config: AudioConfig) {
        const internalConfig = this.store[config.name];
        if (!internalConfig) {
            throw new Error('error');
        }
        const loader = new SimpleHTMLAudioLoader();
        return loader.load(config.url).then((value) => {
            internalConfig.data = value;
        });
    }
}

abstract class AbstractAudioInstance {

    protected loader: any;

    play() {
    }
}

class SimpleHTMLAudioLoader {

    load(url: string) {
        return new Promise<AbstractAudioInstance>((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.addEventListener('canplaythrough', () => {
                const instance = new HTMLAudioInstance();
                resolve(instance);
            });
        });
    }
}

class HTMLAudioInstance extends AbstractAudioInstance {

    play() {

    }
}