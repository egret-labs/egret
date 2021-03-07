var X = window['X'];
window["X"] = X;
class A {

}
window["A"] = A;
__reflect(A.prototype, "A", ["B", "C", "X.E", "X.D"])
