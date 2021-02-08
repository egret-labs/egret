declare namespace egret {

    export class EventDispatcher {

        addEventListener(type: string, listener: Function, thisObject: any): void;
        removeEventListener(type: string, listener: Function, thisObject: any): void
        dispatch(event: Event): void;
        dispatchEventWith(eventName: string, capture?: boolean, data?: any): void;
    }

    export const ticker: {
        $startTick: (callback: Function, obj: any) => void;
    }

    export function getTimer(): number;
}