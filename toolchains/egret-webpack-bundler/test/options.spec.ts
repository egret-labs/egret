import * as path from 'path';
const projectRoot = path.join(__dirname, 'simple-project');
import * as lib from '../lib/index';

describe('测试错误的配置项', () => {

    it('空配置', () => {
        const options = {} as any;
        lib.generateConfig(projectRoot, options, 'web', false);
    });

});
