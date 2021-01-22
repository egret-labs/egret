import { AudioFactory } from './AudioFactory';
import { InternalAudioConfig, AudioConfig, LoaderClass } from './index';

export class AudioManager {

    private store: {
        [name: string]: InternalAudioConfig;
    } = {};

    static context: AudioContext;

    constructor() {
        AudioManager.context = new AudioContext();
    }

    private factories: { [name: string]: AudioFactory; } = {};

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
