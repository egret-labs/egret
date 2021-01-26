import { AudioFactory } from './AudioFactory';
import { AudioConfig, InternalAudioConfig, LoaderClass } from './index';

declare const webkitAudioContext: typeof AudioContext;

function createAudioContext() {
    if (typeof AudioContext !== 'undefined') {
        return new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
        return new webkitAudioContext();
    } else {
        return null;
    }
}

export class AudioManager {

    private store: {
        [name: string]: InternalAudioConfig;
    } = {};

    static instance = new AudioManager();

    static context = createAudioContext()!;

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

    mute(value: boolean, type?: string) {
        for (const key in this.factories) {
            const factory = this.factories[key];
            factory.mute(value);
        }
    }

    getFactory(name: string) {
        if (!this.factories[name]) {
            const internalConfig = this.getInternalConfig(name);
            this.factories[name] = new AudioFactory(internalConfig);
        }
        return this.factories[name];
    }
}
