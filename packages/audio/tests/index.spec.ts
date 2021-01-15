import { AudioManager } from '../';

describe('AudioManager', () => {

    describe('AudioManager.getInstance', () => {

        it('non-existed', () => {
            expect(() => {
                const manager = new AudioManager();
                manager.getInstance('mysound');
            }).toThrowError(new Error('error'));
        });

        it('existed-but-not-loaded', () => {
            expect(() => {
                const manager = new AudioManager();
                manager.register({ name: 'mysound', type: 'temp-type', url: 'temp-url' });
                manager.getInstance('mysound');
            }).toThrowError(new Error('error'));
        });

        // it('exitsted-and-loaded', async () => {
        //     const manager = new AudioManager();
        //     manager.register({ name: 'mysound', type: 'temp-type', url: 'temp-url' });
        //     await manager.load('mysound');
        //     manager.getInstance('mysound');
        // });
    });

    describe('AudioManager.load', () => {
        it('load', async () => {
            const manager = new AudioManager();
            manager.register({ name: 'mysound', type: 'temp-type', url: 'temp-url' });
            await expect(manager.load('mysound')).resolves.toBeTruthy();
        });
    });

});

