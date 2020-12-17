class Example {




    $$runGame$$() {

    }

    dosomething() {
        const timer = new TimerManager();
        timer.register(1000, function () {
            this.$$runGame$$();
        }, this)
    }
}