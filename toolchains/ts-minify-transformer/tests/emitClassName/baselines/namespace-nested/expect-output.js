var a = window['a'];
var a;
(function (a) {
    var b = window['b'];
    let b;
    (function (b) {
        class C {
        }
        b.C = C;
        __reflect(C.prototype, "a.b.C", []);
    })(b || (b = {}));
    window["b"] = b;
})(a || (a = {}));
window["a"] = a;
