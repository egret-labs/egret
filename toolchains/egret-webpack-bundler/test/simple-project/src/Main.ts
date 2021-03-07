class Main {

}

interface InterfaceA {

}

namespace m {

    export interface InterfaceB extends InterfaceC {

    }

    interface InterfaceC {

    }

    class B {

    }
}

function doSomething() {

}

class MyComponent implements InterfaceA, m.InterfaceB {

}