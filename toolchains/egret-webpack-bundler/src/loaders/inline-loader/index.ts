import webpack from 'webpack';

const themeInlineLoader: webpack.loader.Loader = function (text) {
    const currentLoader = this.loaders[this.loaderIndex];
    const options = currentLoader.options;
    const content = options.content;
    return content + text;
    // const options = this.loaders[2].options;
    // console.log(options);
    return text;
};

export default themeInlineLoader;