class MyComponent extends eui.Component {

    customProperty = 1;

    createChildren() {
        super.createChildren();
        console.log(this.customProperty);
    }
}