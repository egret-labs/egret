import { InternalAudioConfig } from './index';
import { AbstractAudioInstance } from "./AbstractAudioInstance";

export class AudioFactory<T extends AbstractAudioInstance = AbstractAudioInstance> {

    private config: InternalAudioConfig;
    private instances: AbstractAudioInstance[] = [];

    constructor(config: InternalAudioConfig) {
        this.config = config;
    }

    load() {
        const loader = new this.config.loaderClass;
        return loader.load(this.config.url).then((value) => {
            this.config.data = value;
        });
    }

    mute(value: boolean) {
        for (const instance of this.instances) {
            instance.mute(value);
        }
    }

    create(): T {
        const instance = new this.config.loaderClass.instanceClass(this.config.data);
        this.instances.push(instance);
        return instance;
    }

}
