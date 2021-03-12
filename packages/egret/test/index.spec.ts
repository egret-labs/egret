import 'jest-webgl-canvas-mock';
global.egret = {};
// console.log(add);
const canvas = document.createElement('canvas');
const img = document.createElement('img');
img.src = '111.png';
const gl = canvas.getContext('webgl');
require('./libs/modules/egret/egret.js');

// const ctx = canvas.getContext('2d');

class VertexBuffer {

    private gl: any;
    type: any;
    private mode: any;
    private buffer: any;

    constructor(gl: any, options?: any) {
        options = options || {};
        this.gl = gl;
        this.type = (options.type !== undefined) ? options.type : gl.FLOAT;
        this.mode = (options.mode !== undefined) ? options.mode : gl.TRIANGLES;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, options.data || options.size, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

describe('VertexBuffer', function () {
    describe('#constructor()', function () {
        // it('should default type to gl.FLOAT', function () {
        //     const vb = new VertexBuffer(gl);

        //     console.log(vb.type === gl.FLOAT);
        // });
        // it('should default mode to gl.TRIANGLES', function () {
        //     const vb = new VertexBuffer(gl);
        //     console.log(vb.type === gl.TRIANGLES);
        // });
        it('ddd', () => {
            // ctx.drawImage(img, 100, 100);
            // // ctx.setTransform(2, 2, 2, 2, 100, 100);
            // // ctx.fillText('helloworld', 0, 20);

            // const dc = ctx.__getDrawCalls();
            // expect(dc).toMatchSnapshot();
        });
    });
});