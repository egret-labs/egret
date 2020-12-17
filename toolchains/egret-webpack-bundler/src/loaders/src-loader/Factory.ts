import * as _fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import parse, { Defines, Dependencies } from './parse';
interface FactoryOptions {
	context: string,
	fs: typeof _fs;
}

export default class Factory {

	public files: {
		[name: string]: {
			mtime: number;
			isModule: boolean;
			dependencies: Dependencies;
			defines: Defines;
		};
	};

	public identifiers: {
		[name: string]: Set<string>;
	};

	constructor(private options: FactoryOptions) {
		options.fs = options.fs || _fs;
		this.files = {}; // 文件分析缓存
		this.identifiers = {}; // 全部全局变量分布
	}

	public get(fileName: string) {
		return this.files[fileName] || null;
	}

	public update() {

		const files = getFilesFromTypesciptCompiler(this.options.context).filter(item => !item.endsWith('.d.ts'))
		// let files: string[] = [];
		// [path.join(this.options.context, 'src')].forEach(dir => {
		// 	const items = glob.sync('**/*.ts', {
		// 		cwd: dir,
		// 	}).map(item => {
		// 		return path.join(dir, item)
		// 	});
		// 	files = files.concat(items);
		// }).filter(item => !item.endsWith('.d.ts'));

		for (let item of files) {
			this.add(item);
		}

		Object.keys(this.files).forEach(item => {
			if (!files.includes(item)) {
				this.remove(item);
			}
		});
	}

	private remove(fileName: string) {
		if (this.files[fileName]) {
			const oldDefines = this.files[fileName].defines;

			// remove identifier
			Object.keys(oldDefines).forEach(name => {
				if (this.identifiers[name]) {
					this.identifiers[name].delete(fileName);

					if (!this.identifiers[name].size) {
						delete this.identifiers[name];
					}
				}
			});

			delete this.files[fileName];
		}
	}

	private add(fileName: string) {
		const fs = this.options.fs;
		const mtime = +fs.statSync(fileName).mtime;

		const { files } = this;

		if (files[fileName] && files[fileName].mtime === mtime) {
			return;
		}

		this.remove(fileName);

		const content = fs.readFileSync(fileName).toString();

		const { defines, dependencies, isModule } = parse(fileName, content);

		// update identifiers
		Object.keys(defines).forEach(name => {
			if (!this.identifiers[name]) {
				this.identifiers[name] = new Set();
			}
			this.identifiers[name].add(fileName);
		});

		files[fileName] = {
			mtime,
			isModule,
			dependencies,
			defines,
		};
	}

	private findDependencyFiles(dependencies: Dependencies): string[] {
		const files: Set<string> = new Set();
		Object.keys(dependencies).forEach(key => {
			let thisFiles: Set<string> | null = null;
			const tmp = key.split('@');
			const names = tmp[0].split('.');
			const namspaces = tmp[1] ? tmp[1].split('.') : [];
			for (let i = namspaces.length; i >= 0; i--) { // 插入一个空的空间
				const ns = namspaces.slice(0, i).join('.');
				for (let j = names.length; j > 0; j--) {
					const name = names.slice(0, j).join('.');
					const fullName = (ns ? ns + '.' : '') + name;
					if (this.identifiers[fullName]) {
						thisFiles = this.identifiers[fullName];
						break;
					}
				}
				if (thisFiles) {
					break;
				}
			}
			if (thisFiles) {
				thisFiles.forEach(item => {
					files.add(item)
				})
			}
		});
		return Array.from(files);
	}

	// 排序非模块化文件
	public sortUnmodules() {
		let list = Object.keys(this.files)
			.filter(file => !this.files[file].isModule)
			.sort();

		// 冒泡排序
		list.forEach(fileName => {
			let dependencyFiles = this.findDependencyFiles(this.files[fileName].dependencies);

			const index = list.findIndex(item => item === fileName);

			// 筛选在自己后面的文件
			dependencyFiles = dependencyFiles.filter(dep => {
				return list.findIndex(item => item === dep) > index;
			});

			if (dependencyFiles.length) {
				list = list.filter(item => !dependencyFiles.includes(item));
				list.splice(index, 0, ...dependencyFiles);
			}
		});

		return list;
	}
}


function getFilesFromTypesciptCompiler(root: string) {
	const jsonPath = findConfigFile(root, 'tsconfig.json')!;
	const data = ts.readConfigFile(jsonPath, ts.sys.readFile);
	const configParseResult = ts.parseJsonConfigFileContent(
		data.config,
		{
			...ts.sys,
			useCaseSensitiveFileNames: true,
		},
		root,
	);
	return configParseResult.fileNames;
}

function findConfigFile(
	requestDirPath: string,
	configFile: string
): string | undefined {
	// If `configFile` is an absolute path, return it right away
	if (path.isAbsolute(configFile)) {
		return ts.sys.fileExists(configFile) ? configFile : undefined;
	}

	// If `configFile` is a relative path, resolve it.
	// We define a relative path as: starts wit
	// one or two dots + a common directory delimiter
	if (configFile.match(/^\.\.?(\/|\\)/) !== null) {
		const resolvedPath = path.resolve(requestDirPath, configFile);
		return ts.sys.fileExists(resolvedPath) ? resolvedPath : undefined;

		// If `configFile` is a file name, find it in the directory tree
	} else {
		while (true) {
			const fileName = path.join(requestDirPath, configFile);
			if (ts.sys.fileExists(fileName)) {
				return fileName;
			}
			const parentPath = path.dirname(requestDirPath);
			if (parentPath === requestDirPath) {
				break;
			}
			requestDirPath = parentPath;
		}

		return undefined;
	}
}