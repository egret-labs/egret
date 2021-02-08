var a = window['a'];
var a;
(function (a) {
    var b = window['b'];
    let b;
    (function (b) {
        class D {
        }
        b.D = D;
        __reflect(D.prototype, "a.b.D", []);
    })(b || (b = {}));
    window["b"] = b;
})(a || (a = {}));
window["a"] = a;
