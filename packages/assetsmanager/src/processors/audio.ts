import { Observable } from 'rxjs';
import { AudioManager } from '@egret/audio';
import { Processor } from '../processors';

export const soundEffectProcessor: Processor = (resource) => {
    return new Observable((s) => {
        const manager = new AudioManager();
        manager.register(resource);
        manager.load(resource.name).then(() => {
            s.next(manager);
            s.complete();
        }
        ).catch(function (error) {
            s.error(error);
        });
    });
};

export const musicProcessor: Processor = (resource) => {
    return new Observable((s) => {
        const manager = new AudioManager();
        manager.register(resource);
        manager.load(resource.name).then(() => {
            s.next(manager);
            s.complete();
        }
        ).catch(function (error) {
            s.error(error);
        });
    });
};