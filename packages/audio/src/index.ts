
export interface AudioConfig {

    name: string,
    type: string,
    url: string
}

export interface InternalAudioConfig extends AudioConfig {

    data?: any;

    loaderClass: LoaderClass
}

export type LoaderClass = { new(): AbstractAudioLoader } & { instanceClass: any }

export abstract class AbstractAudioInstance {

    protected loader: any;

    play() {
    }
}

export abstract class AbstractAudioLoader {

    abstract load(url: string): Promise<any>

}

export * from './AudioFactory';
export * from './AudioManager';
export * from './HTMLAudioInstance';
export * from './SimpleHTMLAudioLoader';
export * from './WebAudioInstance';