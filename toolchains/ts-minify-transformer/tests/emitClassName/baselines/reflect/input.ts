interface B {

}

interface C extends B {

}

namespace X {
    export interface D extends E {

    }

    interface E {

    }
}

class A implements C, X.D {

}

