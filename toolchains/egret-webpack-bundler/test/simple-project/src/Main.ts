class Main {

}

interface InterfaceA {

}

namespace m {

    export interface InterfaceB extends InterfaceC {

    }

    class B {

    }
}

interface InterfaceC {

}

function doSomething() {

}

class MyComponent implements InterfaceA, m.InterfaceB {

}