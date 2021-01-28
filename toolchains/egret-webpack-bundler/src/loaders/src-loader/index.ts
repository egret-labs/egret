import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { CustomLoader, LoaderContext } from '../typings';
import * as utils from '../utils';
import { Factory } from './Factory';

const srcLoader: CustomLoader = function (input, upstreamSourceMap) {
    const callback = this.async();
    const compiler = this._compiler;
    const currentLoader = this.loaders[this.loaderIndex];
    const options = currentLoader.options;
    const factory: Factory = options.factory;
    const isEntry = utils.isEntry(compiler, this.resourcePath);
    let dependencies: string[] = [];
    if (isEntry) {
        // 导入未模块化的全部文件
        dependencies = dependencies.concat(factory.sortUnmodules());
    } else {
        // 只处理入口文件
        return callback(null, input, upstreamSourceMap);
    }

    const dependenciesRequires: string[] = [];
    dependencies.forEach((fileName) => {
        if (fileName !== this.resourcePath) {
            const relative = utils.relative(this.resourcePath, fileName);
            dependenciesRequires.push(`require('${relative}');`);
        }
    });

    const { output, sourceMap } = injectLines(
        input.toString(),
        upstreamSourceMap,
        this,
        [
            ...dependenciesRequires // require语句
        ],
        []
    );

    callback(null, output, sourceMap);
};

function injectLines(
    input: string,
    upstreamSourceMap: RawSourceMap | undefined, // 上级loader sourcemap
    context: LoaderContext,
    headers: string[],
    footers: string[]
) {
    const { resourcePath } = context;
    const lines = input.split(/\n/);
    let headerInjectionIndex = -1;
    let footerInjectionIndex = lines.length;

    lines.forEach((line, index) => {
        if (/^\s*\/\/\s*HEADER_INJECTION_PLACEHOLDER\b/.test(line)) {
            headerInjectionIndex = index;
        }
        if (/^\s*\/\/\s*FOOTER_INJECTION_PLACEHOLDER\b/.test(line)) {
            footerInjectionIndex = index;
        }
    });

    if (headerInjectionIndex > footerInjectionIndex) {
        throw new Error('HEADER_INJECTION_PLACEHOLDER should before FOOTER_INJECTION_PLACEHOLDER');
    }

    const newLines = [
        ...(headerInjectionIndex === -1 ? [] : lines.slice(0, headerInjectionIndex)),
        ...headers,
        ...lines.slice(headerInjectionIndex + 1, footerInjectionIndex),
        ...footers,
        ...lines.slice(footerInjectionIndex + 1)
    ];

    let sourceMap: SourceMapGenerator | undefined;
    if (context.sourceMap) { // 生成sourcemap
        sourceMap = new SourceMapGenerator({
            file: resourcePath
        });

        const getGeneratedLineIndex = (i: number) => {
            if (i < headerInjectionIndex) {
                return i;
            } else if (i < footerInjectionIndex) {
                return i + headers.length + (headerInjectionIndex === -1 ? 0 : -1);
            }
            return i + headers.length + (headerInjectionIndex === -1 ? 0 : -1) + footers.length - 1;
        };

        // 有上级loader sourcemap
        if (upstreamSourceMap && upstreamSourceMap.mappings && upstreamSourceMap.mappings.length) {
            const upstreamSourceMapConsumer = new SourceMapConsumer(upstreamSourceMap);
            upstreamSourceMapConsumer.eachMapping((mapping) => {
                if (mapping.source) {
                    sourceMap!.addMapping({
                        generated: {
                            line: getGeneratedLineIndex(mapping.generatedLine - 1) + 1, // 行号偏移计算
                            column: mapping.generatedColumn
                        },
                        original: {
                            line: mapping.originalLine,
                            column: mapping.originalColumn
                        },
                        source: mapping.source,
                        name: mapping.name
                    });
                }
            });

            if (upstreamSourceMap.sourcesContent) {
                upstreamSourceMap.sourcesContent.forEach((sourceContent, i) => {
                    sourceMap!.setSourceContent(upstreamSourceMap.sources[i], sourceContent);
                });
            }
        } else {
            for (let i = 0; i < lines.length; i++) {
                if (i !== headerInjectionIndex && i !== footerInjectionIndex) {
                    sourceMap!.addMapping({
                        generated: {
                            line: getGeneratedLineIndex(i) + 1, // line从1开始
                            column: 0 // column从0开始
                        },
                        original: {
                            line: i + 1,
                            column: 0
                        },
                        source: resourcePath
                    });
                }
            }

            sourceMap!.setSourceContent(resourcePath, input);
        }
    }

    return {
        output: newLines.join('\n'),
        sourceMap: sourceMap ? JSON.parse(sourceMap.toString()) : undefined
    };
}

export default srcLoader;