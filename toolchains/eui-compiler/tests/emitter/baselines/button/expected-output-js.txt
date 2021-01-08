skins.MyComponent = function (_super) {
    __extends(MyComponent, _super);
    function MyComponent() {
        var _this = _super.call(this) || this;
        _this.skinParts = ["labelDisplay"];
        var a1 = new eui.Label();
        _this.labelDisplay = a1;
        a1.top = 8;
        a1.bottom = 8;
        a1.left = 8;
        a1.right = 8;
        a1.size = 20;
        a1.textColor = 16777215;
        a1.verticalAlign = "middle";
        a1.textAlign = "center";
        _this.elementsContent = [a1];
        return _this;
    }
    return MyComponent;
}(eui.Skin);