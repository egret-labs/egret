class Example {

    private runGame() {

    }

    public dosomething() {
        const timer = new TimerManager();
        timer.register(1000, function () {
            this.runGame();
        }, this)
    }
}

declare class TimerManager {

    register<T>(ilesecond: number, callback: (this: T) => void, callbackThis: T)

}