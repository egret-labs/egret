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
        const internalConfig = this.getInternalConfig(name);
        if (internalConfig.data) {
            return new HTMLAudioInstance();
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

    load(name: string) {
        const internalConfig = this.getInternalConfig(name);
        const loader = new SimpleHTMLAudioLoader();
        return loader.load(internalConfig.url).then((value) => {
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
            // const audio = new Audio();
            // audio.src = url;
            // console.log(2222222222)
            // audio.addEventListener('canplaythrough', () => {
            //     console.log('?????');
            //     const instance = new HTMLAudioInstance();
            //     resolve(instance);
            // });
        });
    }
}

class HTMLAudioInstance extends AbstractAudioInstance {

    play() {

    }
}