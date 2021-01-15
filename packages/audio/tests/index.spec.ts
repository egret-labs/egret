import { AudioManager, HTMLAudioInstance } from '../';

HTMLAudioElement.prototype.load = function () {
    setTimeout(() => {
        this.dispatchEvent(new Event('canplaythrough'));
    }, 100);
};

describe('AudioManager', () => {

    let manager: AudioManager;

    beforeEach(() => {
        manager = new AudioManager();
        manager.register({ name: 'mysound', type: 'temp-type', url: 'temp-url' });
    });

    describe('AudioManager.getInstance', () => {

        it('non-existed', () => {
            expect(() => {
                manager.getInstance('mysound1');
            }).toThrowError(new Error('error'));
        });
        it('existed-but-not-loaded', () => {
            expect(() => {
                manager.getInstance('mysound');
            }).toThrowError(new Error('error'));
        });
        it('existed-and-load', async () => {
            await manager.load('mysound');
            const instance = manager.getInstance('mysound');
            expect(instance).toBeInstanceOf(HTMLAudioInstance);
        });
    });

    describe('AudioManager.load', () => {

        it('load-non-existed', () => {
            expect(() => manager.load('mysound1')).toThrowError(new Error('error'));
        });
        it('load', async () => {
            await expect(manager.load('mysound')).resolves.not.toThrowError();
        });

    });

});