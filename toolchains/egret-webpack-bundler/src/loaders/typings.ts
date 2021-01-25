export type CustomLoader = (this: LoaderContext, content: string, sourcemap?: any) => void;

export type LoaderContext = {

    rootContext: string,

    resourcePath: string

    emitError: (value: any) => void

    loaders: any;

    loaderIndex: number

    async: () => (error: any, content: string, sourcemap?: any) => void;

    sourceMap: boolean

    _compiler: import('webpack').Compiler

}