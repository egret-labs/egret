const fs = require('fs');
const assert = require('assert');
const lib = require('../../lib/eui-config');
const mock = require('mock-fs');


const standardEgretProperties = {"eui":{"themes":['resource/default.thm.json']}}

describe('验证 egretproperties.json', () => {
    
    it('路径错误', () => {
       mock({
           "./a/egretProperties.json":'not a json'
       });
        assert.throws(()=>{
            lib.initilize('.')
        },'应该抛出异常')
        mock.restore();
    });

    it('不是合法JSON文件', () => {
        mock({
            "./egretProperties.json":'not a json'
        });
         assert.throws(()=>{
             lib.initilize('.')
         },'应该抛出异常')
         mock.restore();
     });

     
    it('路径正确', () => {
        mock({
            "./a/egretProperties.json":JSON.stringify(standardEgretProperties)
        });
         assert.doesNotThrow(()=>{
             lib.initilize('a')
         },'不应抛出异常')
         mock.restore();
     });
})

