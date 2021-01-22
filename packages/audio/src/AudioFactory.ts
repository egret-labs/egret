import { InternalAudioConfig } from './index';

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
