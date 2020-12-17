/**
 * 语法分析
 * ast测试地址: https://astexplorer.net/
 */
import * as ts from 'typescript';

type DependencyType = 'Identifier'|'PropertyAccess'|'Extend';

type DefineType = 'Variable'|'Enum'|'Parameter'|'Function'|'Interface'|'Class'|'Namespace';

// 依赖 导入
export interface Dependencies {
  [name: string]: {
    type: DependencyType;
  };
}

// 声名 导出
export interface Defines {
  [name: string]: {
    type: DefineType;
  };
}

// 返回结果
export interface ParseResult {
  isModule: boolean;
  defines: Defines;
  dependencies: Dependencies;
}

/**
 * 判断节点是否有指定modifier
 */
function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (node.modifiers || []).some(item => item.kind === kind);
}

/**
 * 迭代属性节点，获取完整属性名: person.sex
 */
function getExpression(node: any): any {
  if (node.kind === ts.SyntaxKind.Identifier) {
    return node.text;
  }
  if (node.expression) {
    if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const pre = getExpression(node.expression);
      if (typeof pre === 'string' && node.name) {
        return `${pre}.${node.name.text}`;
      }
      return pre;

    }
    // 例如
    // console.log().name 时node.expression = console.log()依赖需收集console.log
    // console['log']() 时依赖需收集console
    return node.expression;

  }
  return null;
}

/**
 * 判断是否是一个新的作用域节点，一般为 {}
 */
function isBlockScope(node: any): boolean {
  return (ts as any).isBlockScope(node);
}

/**
 * 迭代同一作用域下的所有子孙节点
 * 例如: A F 是新作用域{}的起点
 *
 *       A
 *      / \
 *     b   c
 *    / \   \
 *   d   e   F
 *            \
 *             g
 *
 * forEachChild(A) 将逐步迭代 A b c d e F 节点，不会迭代 g 节点
 * 迭代到b时可以return false阻止迭代其子节点 d e，也可以return [ d ] 限制只迭代 d
 */
function forEachChild(node: any, callback: (node: any) => void|any[]|boolean) {
  const walk = (child: any) => {
    if (child.kind !== ts.SyntaxKind.TypeReference) { // 忽略类型检查
      const walkChildren = callback(child);
      if (!isBlockScope(child)) {
        if (Array.isArray(walkChildren)) {
          walkChildren.forEach(walk);
        } else if (walkChildren !== false) {
          ts.forEachChild(child, walk);
        }
      }
    }
  };

  ts.forEachChild(node, walk);
}

interface Declarations {
  [name: string]: {
    type: DefineType;
    ConstKeyword: boolean;
    DeclareKeyword: boolean;
    ExportKeyword: boolean;
  }
}

/**
 * 收集声明
 * 例如const a, b; 将收集到[ a、b ]
 */
function collectNodeDeclarations(node: any, declarations: Declarations) {
  let walkChildren = false;
  const addDeclarations = (name: string, type: string) => {
    declarations[name] = {
      type: type as DefineType,
      ConstKeyword: hasModifier(node, ts.SyntaxKind.ConstKeyword),
      DeclareKeyword: hasModifier(node, ts.SyntaxKind.DeclareKeyword),
      ExportKeyword: hasModifier(node, ts.SyntaxKind.ExportKeyword),
    };
  };
  switch (node.kind) {
    case ts.SyntaxKind.VariableDeclaration:
      // ObjectBindingPattern ArrayBindingPattern
      if (Array.isArray(node.name.elements)) {
        node.name.elements.forEach((el: any) => {
          addDeclarations(el.name.text, 'Variable');
        });
      } else {
        addDeclarations(node.name.text, 'Variable');
      }
      break;
    case ts.SyntaxKind.VariableStatement:
      node.declarationList.declarations.forEach((declaration: any) => {
        addDeclarations(declaration.name.text, 'Variable');
      });
      break;
    case ts.SyntaxKind.EnumDeclaration:
      addDeclarations(node.name.text, 'Enum');
      break;
    case ts.SyntaxKind.Parameter:
      if (Array.isArray(node.name.elements)) {
        node.name.elements.forEach((el: any) => {
          addDeclarations(el.name.text, 'Parameter');
        });
      } else {
        addDeclarations(node.name.text, 'Parameter');
      }
      break;
    case ts.SyntaxKind.FunctionDeclaration:
      addDeclarations(node.name.text, 'Function');
      break;
    case ts.SyntaxKind.InterfaceDeclaration:
      addDeclarations(node.name.text, 'Interface');
      break;
    case ts.SyntaxKind.ClassDeclaration:
      addDeclarations(node.name.text, 'Class');
      break;
    case ts.SyntaxKind.ModuleDeclaration:
      addDeclarations(node.name.text, 'Namespace');
      break;
    default:
      walkChildren = true;
      break;
  }
  return walkChildren;
}

/**
 * 收集依赖
 * 例如: console.log(a) 将收集到[ console、a ]
 */
function collectNodeDepenDencies(node: any, dependencies: Dependencies) {
  let walkChildren: any = false;
  const addDependency = (name: string, type: string) => {
    if (!/^(undefined|null)$/i.test(name)) {
      dependencies[name] = {
        type: type as DependencyType,
      };
    }
  };
  // 只简单的分析一下最外层的依赖
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
      // 当是别人的名字时说明是新定义而非依赖, 例如function fn(a, b) {}里a，b是参数声明
      if (node.parent.name !== node) {
        addDependency(node.text, 'Identifier');
      }
      break;
    case ts.SyntaxKind.PropertyAccessExpression:
      const identifier = getExpression(node);
      if (typeof identifier === 'string') {
        addDependency(identifier, 'PropertyAccess');
      } else if (identifier && identifier.kind) {
        walkChildren = [ identifier ];
      }
      break;
    case ts.SyntaxKind.ClassDeclaration:
      walkChildren = [];
      (node.members || []).forEach((item: any) => {
        if (hasModifier(item, ts.SyntaxKind.StaticKeyword)) {
          walkChildren.push(item);
        }
        (item.decorators || []).forEach((d: any) => {
          walkChildren.push(d);
        });
      });
      (node.heritageClauses || []).forEach((clause: any) => {
        (clause.types || []).forEach((cl : any) => {
          const { expression } = cl;
          const identifier = getExpression(expression);
          if (typeof identifier === 'string') {
            addDependency(identifier, 'Extend');
          } else if (identifier && identifier.kind) {
            walkChildren.push(identifier);
          }
        });
      });
      break;
    default:
      walkChildren = true;
      break;
  }
  return walkChildren;
}

/**
 * 计算外部依赖
 * 外部依赖 = 依赖 - 声明定义
 * 例如: const a, b; console.log(a) 将收集到[ console, a ] - [ a, b ] = [ console ]
 *
 * @param {Array<Object>} scopes 多级作用域声明集合
 * @param {Object} dependencies 依赖
 */
function collectGlobals(scopes: Declarations[], dependencies: Dependencies): Dependencies {
  const globals: Dependencies = {};
  Object.keys(dependencies).forEach(name => {
    const rootName = name.split('.')[0];
    const has = scopes.some(locals => {
      return !!locals[rootName];
    });
    if (!has && !globals[name]) {
      globals[name] = dependencies[name];
    }
  });
  return globals;
}

/**
 * 收集文件的依赖项
 * 例如
 *  namespace A {
 *    console.log('aaa');
 *  }
 * 返回
 *  {
 *     "console@A": {},
 *  }
 * @param {String} namespace 当前所在namespace
 * @param {Array<Object>} scopes 上级们作用域
 */
function collectDependencies(node: any, namespace: string = '', scopes: Declarations[] = []): Dependencies {
  const locals: Declarations = {};
  const dependencies: Dependencies = {};

  forEachChild(node, child => collectNodeDeclarations(child, locals));
  forEachChild(node, child => collectNodeDepenDencies(child, dependencies));

  const thisScopes: Declarations[] = [ locals, ...scopes ];

  const noNamespaceGlobals = collectGlobals(thisScopes, dependencies);

  const globals: Dependencies = {};

  Object.keys(noNamespaceGlobals).forEach(name => {
    globals[`${name}${namespace ? '@' + namespace.slice(0, -1) : ''}`] = noNamespaceGlobals[name];
  });

  forEachChild(node, child => {
    let ns = namespace;
    if (isBlockScope(child)
      && !ts.isFunctionLike(child) // 函数里的依赖管不了，有很多循环依赖
    ) {
      if (ts.isModuleDeclaration(child)) {
        ns = `${ns}${child.name.text}.`;
      }
      Object.assign(globals, collectDependencies(child, ns, thisScopes));
    }
  });

  return globals;
}

/**
 * 收集文件的导出项
 * 例如
 *  namespace A {
 *    export const a;
 *    const b;
 *  }
 *  function fn() {
 *    let i;
 *  }
 * 返回
 *  {
 *    "A": {},
 *    "A.a": {},
 *    "fn": {},
 *  }
 */
function collectDefines(node: any, namespace: string = ''): Defines {
  const declarations: Declarations = {};
  forEachChild(node, child => collectNodeDeclarations(child, declarations));

  const defines: Defines = {};
  Object.keys(declarations).forEach(key => {
    const item = declarations[key];
    if (
      // namespace 里没有export的不需要导出
      !(namespace && !item.ExportKeyword)
      // declare 不需要导出
      && !item.DeclareKeyword
      // interface 不需要导出
      && item.type !== 'Interface'
      // const enum 编译时会用常量代替
      // Compiler Options preserveConstEnums default false
      && !(item.type === 'Enum' && item.ConstKeyword)
    ) {
      defines[`${namespace}${key}`] = {
        type: item.type,
      };
    }
  });

  // 收集namespace里的导出
  forEachChild(node, child => {
    if (ts.isModuleDeclaration(child)) {
      Object.assign(defines, collectDefines(child, `${namespace}${child.name.text}.`));
    }
  });

  return defines;
}

/**
 * 通过export/import判断文件是否是模块化的
 */
function judgeIsModule(node: any): boolean {
  let ret = false;
  forEachChild(node, child => {
    if (hasModifier(child, ts.SyntaxKind.ExportKeyword)
      || child.kind === ts.SyntaxKind.ImportDeclaration
    ) {
      ret = true;
    }
  });
  return ret;
}

export default function fn(fileName: string, content: string): ParseResult {
  // AST 语法树
  const sourceFile = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.ES2015,
    true
  );

  const isModule = judgeIsModule(sourceFile);
  const defines = collectDefines(sourceFile);
  const dependencies = collectDependencies(sourceFile);

  return {
    isModule,
    defines,
    dependencies,
  };
}
