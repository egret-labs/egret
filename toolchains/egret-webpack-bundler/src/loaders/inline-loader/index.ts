import { CustomLoader } from '../typings';

const themeInlineLoader: CustomLoader = function (text, sourcemap?: any) {
    const currentLoader = this.loaders[this.loaderIndex];
    const options = currentLoader.options;
    const content = options.content;
    return content + text;
};

export default themeInlineLoader;