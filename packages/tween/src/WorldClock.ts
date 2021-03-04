export interface TweenContext {

    tick(timeStamp: number): void;
}

export class DefaultWorldClock {

    register(context: TweenContext) {
        egret.ticker.$startTick(context.tick, null);
        return egret.getTimer();
    }
}