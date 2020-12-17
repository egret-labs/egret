skins.MyComponent1 = function (_super) {
    __extends(MyComponent1, _super);
    function MyComponent1() {
        var _this = _super.call(this) || this;
        _this.skinParts = ["image"];
        _this.width = 400;
        var a1 = new eui.Group();
        var a2 = new eui.Image();
        _this.image = a2;
        a2.width = 100;
        a2.source = "a_png";
        a2.includeInLayout = true;
        a2.scale9Grid = new egret.Rectangle(1, 1, 1, 1);
        a1.elementsContent = [a2];
        _this.elementsContent = [a1];
        return _this;
    }
    return MyComponent1;
}(eui.Skin);