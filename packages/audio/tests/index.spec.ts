import { AudioManager, HTMLAudioInstance, SimpleHTMLAudioLoader } from '../';

HTMLAudioElement.prototype.load = function () {
    setTimeout(() => {
        this.dispatchEvent(new Event('canplaythrough'));
    }, 100);
};

globalThis.AudioContext = class { } as any;

describe('AudioManager', () => {

    let manager: AudioManager;

    beforeEach(() => {
        manager = new AudioManager();
        manager.register({ name: 'mysound', type: 'temp-type', url: 'temp-url' }, SimpleHTMLAudioLoader);
    });

    describe('AudioManager.getInstance', () => {

        it('non-existed', () => {
            expect(() => {
                manager.getFactory('mysound1');
            }).toThrowError(new Error('error'));
        });
        // it('existed-but-not-loaded', () => {
        //     expect(() => {
        //         manager.getFactory('mysound');
        //     }).toThrowError(new Error('error'));
        // });
        it('existed-and-load', async () => {
            const factory = manager.getFactory('mysound');
            await factory.load();
            const instance = factory.create();
            expect(instance).toBeInstanceOf(HTMLAudioInstance);
        });
    });

    describe('AudioManager.load', () => {

        it('load-non-existed', () => {
            expect(() => manager.getFactory('mysound1')).toThrowError(new Error('error'));
        });
        it('load', async () => {
            await expect(manager.getFactory('mysound').load()).resolves.not.toThrowError();
        });

    });

});