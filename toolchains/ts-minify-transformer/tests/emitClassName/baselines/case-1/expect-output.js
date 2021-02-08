class A {


}
window["A"] = A;
__reflect(A.prototype, "A", [])

var a = window['a'];
var a;
(function (a) {
    class B {
    }
    a.B = B;
    __reflect(B.prototype, "a.B", []);
})(a || (a = {}));
window["a"] = a;
