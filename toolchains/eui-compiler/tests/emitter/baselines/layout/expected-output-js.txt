skins.MyComponent = function (_super) {
    __extends(MyComponent, _super);
    function MyComponent() {
        var _this = _super.call(this) || this;
        _this.skinParts = [];
        var a1 = new eui.Group();
        var a2 = new eui.HorizontalLayout();
        a2.verticalAlign = "middle";
        a2.gap = 10;
        a2.paddingLeft = 2;
        a1.layout = a2;
        _this.elementsContent = [a1];
        return _this;
    }
    return MyComponent;
}(eui.Skin);