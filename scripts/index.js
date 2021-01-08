const eol = require('eol');
const fs = require('fs-extra');
const path = require('path');

// 从目录开始
function genFileList(path) {
    const filesList = [];
    readFile(path, filesList);
    // return filesList;
}

// 遍历读取文件
function readFile(_path, filesList) {
    files = fs.readdirSync(_path); // 需要用到同步读取
    files.forEach((file) => {

        states = fs.statSync(_path + '/' + file);
        // ❤❤❤ 判断是否是目录，是就继续递归
        if (states.isDirectory()) {
            if (file == 'node_modules' ||
                file == '.git') {
                return;
            }
            readFile(_path + '/' + file, filesList);
        } else {
            // 不是就将文件push进数组，此处可以正则匹配是否是 .js 先忽略
            // filesList.push(file);
            const arr = file.split('.');
            if (['ts', 'js', 'json', 'exml', 'md', 'txt'].includes(arr[arr.length - 1])) {
                // console.log(path.join(_path, file))
                const url = path.join(_path, file);
                const text = fs.readFileSync(url, 'utf-8');
                fs.writeFileSync(url, eol.lf(text));
            }
        }
    });
}

const res = genFileList(path.resolve(__dirname, '../toolchains/eui-compiler/tests')); // __dirname是当前路径，可以修改
// let res = genFileList('D:/demo/test');
// console.log(__dirname);
// console.log(res)