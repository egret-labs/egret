//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

/**
 * @private
 */
interface CanvasRenderingContext2D {
    imageSmoothingEnabled: boolean;
    $imageSmoothingEnabled: boolean;
    $offsetX: number;
    $offsetY: number;
}

namespace egret {

    const blendModes = ['source-over', 'lighter', 'destination-out'];
    const defaultCompositeOp = 'source-over';
    const BLACK_COLOR = '#000000';
    const CAPS_STYLES = { none: 'butt', square: 'square', round: 'round' };
    const renderBufferPool: sys.RenderBuffer[] = [];//渲染缓冲区对象池
    const renderBufferPool_Filters: sys.RenderBuffer[] = [];//滤镜缓冲区对象池
    export class CanvasRenderer {

        private nestLevel: number = 0;//渲染的嵌套层次，0表示在调用堆栈的最外层。

        public render(displayObject: DisplayObject, buffer: sys.RenderBuffer, matrix: Matrix, forRenderTexture?: boolean): number {
            this.nestLevel++;
            const context: CanvasRenderingContext2D = buffer.context;
            const root: DisplayObject = forRenderTexture ? displayObject : null;
            //绘制显示对象
            context.transform(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0);
            const drawCall = this.drawDisplayObject(displayObject, context, matrix.tx, matrix.ty, true);
            const invert = Matrix.create();
            matrix.$invertInto(invert);
            context.transform(invert.a, invert.b, invert.c, invert.d, 0, 0);
            Matrix.release(invert);
            this.nestLevel--;
            if (this.nestLevel === 0) {
                //最大缓存6个渲染缓冲
                if (renderBufferPool.length > 6) {
                    renderBufferPool.length = 6;
                }
                const length = renderBufferPool.length;
                for (let i = 0; i < length; i++) {
                    renderBufferPool[i].resize(0, 0);
                }
            }
            return drawCall;
        }

        /**
         * @private
         * 绘制一个显示对象
         */
        private drawDisplayObject(displayObject: DisplayObject, context: CanvasRenderingContext2D, offsetX: number, offsetY: number, isStage?: boolean): number {
            let drawCalls = 0;
            let node: sys.RenderNode;
            const displayList = displayObject.$displayList;
            if (displayList && !isStage) {
                if (displayObject.$cacheDirty || displayObject.$renderDirty ||
                    displayList.$canvasScaleX != sys.DisplayList.$canvasScaleX ||
                    displayList.$canvasScaleY != sys.DisplayList.$canvasScaleY) {
                    drawCalls += displayList.drawToSurface();
                }
                node = displayList.$renderNode;
            }
            else {
                if (displayObject.$renderDirty) {
                    node = displayObject.$getRenderNode();
                }
                else {
                    node = displayObject.$renderNode;
                }
            }
            displayObject.$cacheDirty = false;
            if (node) {
                drawCalls++;
                context.$offsetX = offsetX;
                context.$offsetY = offsetY;
                switch (node.type) {
                    case sys.RenderNodeType.BitmapNode:
                        this.renderBitmap(<sys.BitmapNode>node, context);
                        break;
                    case sys.RenderNodeType.TextNode:
                        this.renderText(<sys.TextNode>node, context);
                        break;
                    case sys.RenderNodeType.GraphicsNode:
                        this.renderGraphics(<sys.GraphicsNode>node, context);
                        break;
                    case sys.RenderNodeType.GroupNode:
                        this.renderGroup(<sys.GroupNode>node, context);
                        break;
                    case sys.RenderNodeType.MeshNode:
                        this.renderMesh(<sys.MeshNode>node, context);
                        break;
                    case sys.RenderNodeType.NormalBitmapNode:
                        this.renderNormalBitmap(<sys.NormalBitmapNode>node, context);
                        break;
                }
                context.$offsetX = 0;
                context.$offsetY = 0;
            }
            if (displayList && !isStage) {
                return drawCalls;
            }
            const children = displayObject.$children;
            if (children) {
                const length = children.length;
                for (let i = 0; i < length; i++) {
                    const child = children[i];
                    let offsetX2;
                    let offsetY2;
                    if (child.$useTranslate) {
                        const m = child.$getMatrix();
                        offsetX2 = offsetX + child.$x;
                        offsetY2 = offsetY + child.$y;
                        context.save();
                        context.transform(m.a, m.b, m.c, m.d, offsetX2, offsetY2);
                        offsetX2 = -child.$anchorOffsetX;
                        offsetY2 = -child.$anchorOffsetY;
                    }
                    else {
                        offsetX2 = offsetX + child.$x - child.$anchorOffsetX;
                        offsetY2 = offsetY + child.$y - child.$anchorOffsetY;
                    }
                    let tempAlpha;
                    if (child.$alpha != 1) {
                        tempAlpha = context.globalAlpha;
                        context.globalAlpha *= child.$alpha;
                    }
                    switch (child.$renderMode) {
                        case RenderMode.NONE:
                            break;
                        case RenderMode.FILTER:
                            drawCalls += this.drawWithFilter(child, context, offsetX2, offsetY2);
                            break;
                        case RenderMode.CLIP:
                            drawCalls += this.drawWithClip(child, context, offsetX2, offsetY2);
                            break;
                        case RenderMode.SCROLLRECT:
                            drawCalls += this.drawWithScrollRect(child, context, offsetX2, offsetY2);
                            break;
                        default:
                            drawCalls += this.drawDisplayObject(child, context, offsetX2, offsetY2);
                            break;
                    }
                    if (child.$useTranslate) {
                        context.restore();
                    }
                    else if (tempAlpha) {
                        context.globalAlpha = tempAlpha;
                    }
                }
            }
            return drawCalls;
        }

        private drawWithFilter(displayObject: DisplayObject, context: CanvasRenderingContext2D, offsetX: number, offsetY: number): number {
            if (displayObject.$children && displayObject.$children.length == 0 && (!displayObject.$renderNode || displayObject.$renderNode.$getRenderCount() == 0)) {
                return 0;
            }
            let drawCalls = 0;
            const filters = displayObject.$filters;
            const filtersLen: number = filters.length;
            const hasBlendMode = (displayObject.$blendMode !== 0);
            let compositeOp: string;
            if (hasBlendMode) {
                compositeOp = blendModes[displayObject.$blendMode];
                if (!compositeOp) {
                    compositeOp = defaultCompositeOp;
                }
            }
            const displayBounds = displayObject.$getOriginalBounds();
            const displayBoundsX = displayBounds.x;
            const displayBoundsY = displayBounds.y;
            const displayBoundsWidth = displayBounds.width;
            const displayBoundsHeight = displayBounds.height;
            if (displayBoundsWidth <= 0 || displayBoundsHeight <= 0) {
                return drawCalls;
            }
            // 为显示对象创建一个新的buffer
            const displayBuffer = this.createRenderBuffer(displayBoundsWidth - displayBoundsX, displayBoundsHeight - displayBoundsY, true);
            const displayContext = displayBuffer.context;
            if (displayObject.$mask) {
                drawCalls += this.drawWithClip(displayObject, displayContext, -displayBoundsX, -displayBoundsY);
            }
            else if (displayObject.$scrollRect || displayObject.$maskRect) {
                drawCalls += this.drawWithScrollRect(displayObject, displayContext, -displayBoundsX, -displayBoundsY);
            }
            else {
                drawCalls += this.drawDisplayObject(displayObject, displayContext, -displayBoundsX, -displayBoundsY);
            }

            //绘制结果到屏幕
            if (drawCalls > 0) {
                if (hasBlendMode) {
                    context.globalCompositeOperation = compositeOp;
                }
                drawCalls++;
                // 应用滤镜
                const imageData = displayContext.getImageData(0, 0, displayBuffer.surface.width, displayBuffer.surface.height);
                for (let i = 0; i < filtersLen; i++) {
                    const filter = filters[i];

                    if (filter.type == 'colorTransform') {
                        colorFilter(imageData.data, displayBuffer.surface.width, displayBuffer.surface.height, (<ColorMatrixFilter>filter).$matrix);
                    } else if (filter.type == 'blur') {
                        blurFilter(imageData.data, displayBuffer.surface.width, displayBuffer.surface.height, (<BlurFilter>filter).$blurX, (<BlurFilter>filter).$blurY);
                    } else if (filter.type == 'glow') {
                        const r = (<GlowFilter>filter).$red;
                        const g = (<GlowFilter>filter).$green;
                        const b = (<GlowFilter>filter).$blue;
                        const a = (<GlowFilter>filter).$alpha;
                        if ((<GlowFilter>filter).$inner || (<GlowFilter>filter).$knockout || (<DropShadowFilter>filter).$hideObject) {
                            dropShadowFilter2(imageData.data, displayBuffer.surface.width, displayBuffer.surface.height, [r / 255, g / 255, b / 255, a], (<GlowFilter>filter).$blurX, (<GlowFilter>filter).$blurY,
                                (<DropShadowFilter>filter).$angle ? ((<DropShadowFilter>filter).$angle / 180 * Math.PI) : 0, (<DropShadowFilter>filter).$distance || 0, (<GlowFilter>filter).$strength, (<GlowFilter>filter).$inner ? 1 : 0, (<GlowFilter>filter).$knockout ? 0 : 1, (<DropShadowFilter>filter).$hideObject ? 1 : 0);
                        } else {
                            // 如果没有高级效果，使用性能比较高的方式
                            dropShadowFilter(imageData.data, displayBuffer.surface.width, displayBuffer.surface.height, [r / 255, g / 255, b / 255, a], (<GlowFilter>filter).$blurX, (<GlowFilter>filter).$blurY, (<DropShadowFilter>filter).$angle ? ((<DropShadowFilter>filter).$angle / 180 * Math.PI) : 0, (<DropShadowFilter>filter).$distance || 0, (<GlowFilter>filter).$strength);
                        }
                    } else if (filter.type == 'custom') {
                        // 目前canvas渲染不支持自定义滤镜
                    }
                }
                displayContext.putImageData(imageData, 0, 0);
                // 绘制结果的时候，应用滤镜
                context.drawImage(displayBuffer.surface, offsetX + displayBoundsX, offsetY + displayBoundsY);
                if (hasBlendMode) {
                    context.globalCompositeOperation = defaultCompositeOp;
                }

            }
            renderBufferPool_Filters.push(displayBuffer);
            return drawCalls;
        }

        private drawWithClip(displayObject: DisplayObject, context: CanvasRenderingContext2D, offsetX: number, offsetY: number): number {
            let drawCalls = 0;
            const hasBlendMode = (displayObject.$blendMode !== 0);
            let compositeOp: string;
            if (hasBlendMode) {
                compositeOp = blendModes[displayObject.$blendMode];
                if (!compositeOp) {
                    compositeOp = defaultCompositeOp;
                }
            }

            const scrollRect = displayObject.$scrollRect ? displayObject.$scrollRect : displayObject.$maskRect;
            const mask = displayObject.$mask;
            if (mask) {
                const maskRenderMatrix = mask.$getMatrix();
                //遮罩scaleX或scaleY为0，放弃绘制
                if ((maskRenderMatrix.a == 0 && maskRenderMatrix.b == 0) || (maskRenderMatrix.c == 0 && maskRenderMatrix.d == 0)) {
                    return drawCalls;
                }
            }

            //没有遮罩,同时显示对象没有子项
            if (!mask && (!displayObject.$children || displayObject.$children.length == 0)) {
                if (scrollRect) {
                    context.save();
                    context.beginPath();
                    context.rect(scrollRect.x + offsetX, scrollRect.y + offsetY, scrollRect.width, scrollRect.height);
                    context.clip();
                }

                if (hasBlendMode) {
                    context.globalCompositeOperation = compositeOp;
                }
                drawCalls += this.drawDisplayObject(displayObject, context, offsetX, offsetY);
                if (hasBlendMode) {
                    context.globalCompositeOperation = defaultCompositeOp;
                }
                if (scrollRect) {
                    context.restore();
                }
                return drawCalls;
            }
            //遮罩是单纯的填充图形,且alpha为1,性能优化
            if (mask) {
                const maskRenderNode = mask.$getRenderNode();
                if ((!mask.$children || mask.$children.length == 0) &&
                    maskRenderNode && maskRenderNode.type == sys.RenderNodeType.GraphicsNode &&
                    maskRenderNode.drawData.length == 1 &&
                    (<sys.Path2D>maskRenderNode.drawData[0]).type == sys.PathType.Fill &&
                    (<sys.FillPath>maskRenderNode.drawData[0]).fillAlpha == 1) {
                    this.renderingMask = true;
                    context.save();
                    const maskMatrix = Matrix.create();
                    maskMatrix.copyFrom(mask.$getConcatenatedMatrix());
                    mask.$getConcatenatedMatrixAt(displayObject, maskMatrix);
                    maskMatrix.prepend(1, 0, 0, 1, offsetX, offsetY);
                    context.transform(maskMatrix.a, maskMatrix.b, maskMatrix.c, maskMatrix.d, maskMatrix.tx, maskMatrix.ty);
                    let calls = this.drawDisplayObject(mask, context, 0, 0);
                    this.renderingMask = false;
                    maskMatrix.$invertInto(maskMatrix);
                    context.transform(maskMatrix.a, maskMatrix.b, maskMatrix.c, maskMatrix.d, maskMatrix.tx, maskMatrix.ty);
                    Matrix.release(maskMatrix);
                    if (scrollRect) {
                        context.beginPath();
                        context.rect(scrollRect.x + offsetX, scrollRect.y + offsetY, scrollRect.width, scrollRect.height);
                        context.clip();
                    }
                    calls += this.drawDisplayObject(displayObject, context, offsetX, offsetY);
                    context.restore();
                    return calls;
                }
            }

            //todo 若显示对象是容器，同时子项有混合模式，则需要先绘制背景到displayBuffer并清除背景区域

            //绘制显示对象自身，若有scrollRect，应用clip
            const displayBounds = displayObject.$getOriginalBounds();
            const displayBoundsX = displayBounds.x;
            const displayBoundsY = displayBounds.y;
            const displayBoundsWidth = displayBounds.width;
            const displayBoundsHeight = displayBounds.height;
            if (displayBoundsWidth <= 0 || displayBoundsHeight <= 0) {
                return drawCalls;
            }
            const displayBuffer = this.createRenderBuffer(displayBoundsWidth, displayBoundsHeight);
            const displayContext: CanvasRenderingContext2D = displayBuffer.context;
            if (!displayContext) {//RenderContext创建失败，放弃绘制遮罩。
                drawCalls += this.drawDisplayObject(displayObject, context, offsetX, offsetY);
                return drawCalls;
            }

            drawCalls += this.drawDisplayObject(displayObject, displayContext, -displayBoundsX, -displayBoundsY);
            //绘制遮罩
            if (mask) {
                const maskRenderNode = mask.$getRenderNode();
                const maskMatrix = Matrix.create();
                maskMatrix.copyFrom(mask.$getConcatenatedMatrix());
                mask.$getConcatenatedMatrixAt(displayObject, maskMatrix);
                maskMatrix.translate(-displayBoundsX, -displayBoundsY);
                //如果只有一次绘制或是已经被cache直接绘制到displayContext
                if (maskRenderNode && maskRenderNode.$getRenderCount() == 1 || mask.$displayList) {
                    displayContext.globalCompositeOperation = 'destination-in';
                    displayContext.save();
                    displayContext.setTransform(maskMatrix.a, maskMatrix.b, maskMatrix.c, maskMatrix.d, maskMatrix.tx, maskMatrix.ty);
                    drawCalls += this.drawDisplayObject(mask, displayContext, 0, 0);
                    displayContext.restore();
                }
                else {
                    const maskBuffer = this.createRenderBuffer(displayBoundsWidth, displayBoundsHeight);
                    const maskContext = maskBuffer.context;
                    maskContext.setTransform(maskMatrix.a, maskMatrix.b, maskMatrix.c, maskMatrix.d, maskMatrix.tx, maskMatrix.ty);
                    drawCalls += this.drawDisplayObject(mask, maskContext, 0, 0);
                    displayContext.globalCompositeOperation = 'destination-in';
                    displayContext.drawImage(maskBuffer.surface, 0, 0);
                    renderBufferPool.push(maskBuffer);
                }
                Matrix.release(maskMatrix);
            }

            //绘制结果到屏幕
            if (drawCalls > 0) {
                drawCalls++;
                if (hasBlendMode) {
                    context.globalCompositeOperation = compositeOp;
                }
                if (scrollRect) {
                    context.save();
                    context.beginPath();
                    context.rect(scrollRect.x + offsetX, scrollRect.y + offsetY, scrollRect.width, scrollRect.height);
                    context.clip();
                }
                context.drawImage(<any>displayBuffer.surface, offsetX + displayBoundsX, offsetY + displayBoundsY);
                if (scrollRect) {
                    context.restore();
                }
                if (hasBlendMode) {
                    context.globalCompositeOperation = defaultCompositeOp;
                }
            }
            renderBufferPool.push(displayBuffer);
            return drawCalls;
        }

        private drawWithScrollRect(displayObject: DisplayObject, context: CanvasRenderingContext2D, offsetX: number, offsetY: number): number {
            let drawCalls = 0;
            const scrollRect = displayObject.$scrollRect ? displayObject.$scrollRect : displayObject.$maskRect;
            if (scrollRect.isEmpty()) {
                return drawCalls;
            }
            if (displayObject.$scrollRect) {
                offsetX -= scrollRect.x;
                offsetY -= scrollRect.y;
            }
            //绘制显示对象自身
            context.save();
            context.beginPath();
            context.rect(scrollRect.x + offsetX, scrollRect.y + offsetY, scrollRect.width, scrollRect.height);
            context.clip();
            drawCalls += this.drawDisplayObject(displayObject, context, offsetX, offsetY);
            context.restore();
            return drawCalls;
        }

        public drawNodeToBuffer(node: sys.RenderNode, buffer: sys.RenderBuffer, matrix: Matrix, forHitTest?: boolean): void {
            const context: CanvasRenderingContext2D = buffer.context;
            context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            this.renderNode(node, context, forHitTest);
        }

        /**
         * 将一个DisplayObject绘制到渲染缓冲，用于RenderTexture绘制
         * @param displayObject 要绘制的显示对象
         * @param buffer 渲染缓冲
         * @param matrix 要叠加的矩阵
         */
        public drawDisplayToBuffer(displayObject: DisplayObject, buffer: sys.RenderBuffer, matrix: Matrix): number {
            const context: CanvasRenderingContext2D = buffer.context;
            if (matrix) {
                context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            }
            let node: sys.RenderNode;
            if (displayObject.$renderDirty) {
                node = displayObject.$getRenderNode();
            }
            else {
                node = displayObject.$renderNode;
            }
            let drawCalls = 0;
            if (node) {
                drawCalls++;
                switch (node.type) {
                    case sys.RenderNodeType.BitmapNode:
                        this.renderBitmap(<sys.BitmapNode>node, context);
                        break;
                    case sys.RenderNodeType.TextNode:
                        this.renderText(<sys.TextNode>node, context);
                        break;
                    case sys.RenderNodeType.GraphicsNode:
                        this.renderGraphics(<sys.GraphicsNode>node, context);
                        break;
                    case sys.RenderNodeType.GroupNode:
                        this.renderGroup(<sys.GroupNode>node, context);
                        break;
                    case sys.RenderNodeType.MeshNode:
                        this.renderMesh(<sys.MeshNode>node, context);
                        break;
                    case sys.RenderNodeType.NormalBitmapNode:
                        this.renderNormalBitmap(<sys.NormalBitmapNode>node, context);
                        break;
                }
            }
            const children = displayObject.$children;
            if (children) {
                const length = children.length;
                for (let i = 0; i < length; i++) {
                    const child = children[i];
                    switch (child.$renderMode) {
                        case RenderMode.NONE:
                            break;
                        case RenderMode.FILTER:
                            drawCalls += this.drawWithFilter(child, context, 0, 0);
                            break;
                        case RenderMode.CLIP:
                            drawCalls += this.drawWithClip(child, context, 0, 0);
                            break;
                        case RenderMode.SCROLLRECT:
                            drawCalls += this.drawWithScrollRect(child, context, 0, 0);
                            break;
                        default:
                            drawCalls += this.drawDisplayObject(child, context, 0, 0);
                            break;
                    }
                }
            }
            return drawCalls;
        }

        private renderNode(node: sys.RenderNode, context: CanvasRenderingContext2D, forHitTest?: boolean): number {
            let drawCalls = 0;
            switch (node.type) {
                case sys.RenderNodeType.BitmapNode:
                    drawCalls = this.renderBitmap(<sys.BitmapNode>node, context);
                    break;
                case sys.RenderNodeType.TextNode:
                    drawCalls = 1;
                    this.renderText(<sys.TextNode>node, context);
                    break;
                case sys.RenderNodeType.GraphicsNode:
                    drawCalls = this.renderGraphics(<sys.GraphicsNode>node, context, forHitTest);
                    break;
                case sys.RenderNodeType.GroupNode:
                    drawCalls = this.renderGroup(<sys.GroupNode>node, context);
                    break;
                case sys.RenderNodeType.MeshNode:
                    drawCalls = this.renderMesh(<sys.MeshNode>node, context);
                    break;
                case sys.RenderNodeType.NormalBitmapNode:
                    drawCalls += this.renderNormalBitmap(<sys.NormalBitmapNode>node, context);
                    break;
            }
            return drawCalls;
        }

        private renderNormalBitmap(node: sys.NormalBitmapNode, context: CanvasRenderingContext2D): number {
            const image = node.image;
            if (!image || !image.source) {
                return 0;
            }
            if (context.$imageSmoothingEnabled != node.smoothing) {
                context.imageSmoothingEnabled = node.smoothing;
                context.$imageSmoothingEnabled = node.smoothing;
            }

            if (node.rotated) {
                const sourceX = node.sourceX;
                const sourceY = node.sourceY;
                const sourceHeight = node.sourceW;
                const sourceWidth = node.sourceH;
                const offsetX = node.drawX;
                const offsetY = node.drawY;
                const destHeight = node.drawW;
                const destWidth = node.drawH;
                context.save();
                context.transform(0, -1, 1, 0, 0, destWidth);
                context.drawImage(image.source, sourceX, sourceY, sourceWidth, sourceHeight, offsetX + context.$offsetX, offsetY + context.$offsetY, destWidth, destHeight);
                context.restore();
            }
            else {
                context.drawImage(image.source, node.sourceX, node.sourceY, node.sourceW, node.sourceH,
                    node.drawX + context.$offsetX, node.drawY + context.$offsetY, node.drawW, node.drawH);
            }
            return 1;
        }

        private renderBitmap(node: sys.BitmapNode, context: CanvasRenderingContext2D): number {
            const image = node.image;
            if (!image || !image.source) {
                return 0;
            }
            if (context.$imageSmoothingEnabled != node.smoothing) {
                context.imageSmoothingEnabled = node.smoothing;
                context.$imageSmoothingEnabled = node.smoothing;
            }
            const data = node.drawData;
            const length = data.length;
            let pos = 0;
            const m = node.matrix;
            const blendMode = node.blendMode;
            const alpha = node.alpha;
            let saved = false;
            let offsetX;
            let offsetY;
            if (m) {
                context.save();
                saved = true;
                if (context.$offsetX != 0 || context.$offsetY != 0) {
                    context.translate(context.$offsetX, context.$offsetY);
                    offsetX = context.$offsetX;
                    offsetY = context.$offsetY;
                    context.$offsetX = context.$offsetY = 0;
                }
                context.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
            }
            //这里不考虑嵌套
            if (blendMode) {
                context.globalCompositeOperation = blendModes[blendMode];
            }
            let originAlpha: number;
            if (alpha == alpha) {
                originAlpha = context.globalAlpha;
                context.globalAlpha *= alpha;
            }
            let drawCalls: number = 0;
            const filter = node.filter;
            //todo 暂时只考虑绘制一次的情况
            if (filter && length == 8) {
                const sourceX = data[0];
                const sourceY = data[1];
                let sourceWidth = data[2];
                let sourceHeight = data[3];
                const offsetX = data[4];
                const offsetY = data[5];
                let destWidth = data[6];
                let destHeight = data[7];
                if (node.rotated) {
                    sourceWidth = data[3];
                    sourceHeight = data[2];
                    destWidth = data[7];
                    destHeight = data[6];
                }
                const displayBuffer = this.createRenderBuffer(destWidth, destHeight);
                const displayContext = displayBuffer.context;
                drawCalls++;
                if (node.rotated) {
                    context.transform(0, -1, 1, 0, 0, destWidth);
                }
                displayContext.drawImage(image.source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, destWidth, destHeight);
                //绘制结果到屏幕
                drawCalls++;
                // 应用滤镜
                const imageData = displayContext.getImageData(0, 0, destWidth, destHeight);
                colorFilter(imageData.data, destWidth, destHeight, (<ColorMatrixFilter>filter).$matrix);
                displayContext.putImageData(imageData, 0, 0);
                // 绘制结果的时候，应用滤镜
                context.drawImage(displayBuffer.surface, 0, 0, destWidth, destHeight,
                    offsetX + context.$offsetX, offsetY + context.$offsetY, destWidth, destHeight);
                renderBufferPool.push(displayBuffer);
            }
            else {
                while (pos < length) {
                    drawCalls++;
                    if (node.rotated) {
                        const sourceX = data[pos++];
                        const sourceY = data[pos++];
                        const sourceHeight = data[pos++];
                        const sourceWidth = data[pos++];
                        const offsetX = data[pos++];
                        const offsetY = data[pos++];
                        const destHeight = data[pos++];
                        const destWidth = data[pos++];
                        context.save();
                        context.transform(0, -1, 1, 0, 0, destWidth);
                        context.drawImage(image.source, sourceX, sourceY, sourceWidth, sourceHeight,
                            offsetX + context.$offsetX, offsetY + context.$offsetY, destWidth, destHeight);
                        context.restore();
                    }
                    else {
                        context.drawImage(image.source, data[pos++], data[pos++], data[pos++], data[pos++],
                            data[pos++] + context.$offsetX, data[pos++] + context.$offsetY, data[pos++], data[pos++]);
                    }
                }
            }
            if (saved) {
                context.restore();
            }
            else {
                if (blendMode) {
                    context.globalCompositeOperation = defaultCompositeOp;
                }
                if (alpha == alpha) {
                    context.globalAlpha = originAlpha;
                }
            }
            if (offsetX) {
                context.$offsetX = offsetX;
            }
            if (offsetY) {
                context.$offsetY = offsetY;
            }
            return drawCalls;
        }

        private renderMesh(node: sys.MeshNode, context: CanvasRenderingContext2D): number {
            const image = node.image;
            const data = node.drawData;
            const dataLength = data.length;
            let pos = 0;
            const m = node.matrix;
            const blendMode = node.blendMode;
            const alpha = node.alpha;
            let savedMatrix;
            let offsetX;
            let offsetY;
            let saved: boolean = false;
            let drawCalls = 0;

            if (context.$imageSmoothingEnabled != node.smoothing) {
                context.imageSmoothingEnabled = node.smoothing;
                context.$imageSmoothingEnabled = node.smoothing;
            }

            if (m) {
                context.save();
                saved = true;
                if (context.$offsetX != 0 || context.$offsetY != 0) {
                    context.translate(context.$offsetX, context.$offsetY);
                    offsetX = context.$offsetX;
                    offsetY = context.$offsetY;
                    context.$offsetX = context.$offsetY = 0;
                }
                context.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
            }

            //这里不考虑嵌套
            if (blendMode) {
                context.globalCompositeOperation = blendModes[blendMode];
            }

            // 设置alpha
            let originAlpha: number;
            if (alpha == alpha) {
                originAlpha = context.globalAlpha;
                context.globalAlpha *= alpha;
            }
            //暂不考虑滤镜
            // if (node.filter) {
            //     buffer.context.$filter = node.filter;
            //     while (pos < length) {
            //         buffer.context.drawMesh(image, data[pos++], data[pos++], data[pos++], data[pos++],
            //             data[pos++], data[pos++], data[pos++], data[pos++], node.imageWidth, node.imageHeight, node.uvs, node.vertices, node.indices, node.bounds, node.rotated, node.smoothing);
            //     }
            //     buffer.context.$filter = null;
            // }
            // else {
            while (pos < dataLength) {
                drawCalls += this.drawMesh(image, data[pos++], data[pos++], data[pos++], data[pos++],
                    data[pos++], data[pos++], data[pos++], data[pos++], node.uvs, node.vertices, node.indices, node.bounds, node.rotated, context);
            }
            if (blendMode) {
                context.globalCompositeOperation = defaultCompositeOp;
            }

            if (alpha == alpha) {
                context.globalAlpha = originAlpha;
            }

            if (offsetX) {
                context.$offsetX = offsetX;
            }
            if (offsetY) {
                context.$offsetY = offsetY;
            }
            if (saved) {
                context.restore();
            }

            return drawCalls;
        }

        private drawMesh(image: BitmapData,
            sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number,
            offsetX: number, offsetY: number, destWidth: number, destHeight: number,
            meshUVs: number[], meshVertices: number[], meshIndices: number[], bounds: Rectangle, rotated: boolean, context: CanvasRenderingContext2D,
        ): number {
            if (!context || !image) {
                return;
            }

            let drawCalls = 0;
            let u0 = NaN, u1 = NaN, u2 = NaN, v0 = NaN, v1 = NaN, v2 = NaN;
            let a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0;

            let _sourceWidth = sourceWidth;
            let _sourceHeight = sourceHeight;
            let _destWidth = destWidth;
            let _destHeight = destHeight;
            if (rotated) {
                _sourceWidth = sourceHeight;
                _sourceHeight = sourceWidth;
                _destWidth = destHeight;
                _destHeight = destWidth;
            }
            const indicesLen = meshIndices.length;
            let index1: number, index2: number, index3: number;
            let x0: number, y0: number, x1: number, y1: number, x2: number, y2: number;
            for (let i = 0; i < indicesLen; i += 3) {
                index1 = meshIndices[i] * 2, index2 = meshIndices[i + 1] * 2, index3 = meshIndices[i + 2] * 2;
                u0 = meshUVs[index1] * sourceWidth;
                v0 = meshUVs[index1 + 1] * sourceHeight;
                u1 = meshUVs[index2] * sourceWidth;
                v1 = meshUVs[index2 + 1] * sourceHeight;
                u2 = meshUVs[index3] * sourceWidth;
                v2 = meshUVs[index3 + 1] * sourceHeight;

                x0 = meshVertices[index1];
                y0 = meshVertices[index1 + 1];
                x1 = meshVertices[index2];
                y1 = meshVertices[index2 + 1];
                x2 = meshVertices[index3];
                y2 = meshVertices[index3 + 1];
                context.save();
                context.beginPath();
                context.moveTo(x0, y0);
                context.lineTo(x1, y1);
                context.lineTo(x2, y2);
                context.closePath();
                context.clip();
                const ratio = 1 / ((u0 * v1) + (v0 * u2) + (u1 * v2) - (v1 * u2) - (v0 * u1) - (u0 * v2));
                a = (x0 * v1) + (v0 * x2) + (x1 * v2) - (v1 * x2) - (v0 * x1) - (x0 * v2);
                b = (y0 * v1) + (v0 * y2) + (y1 * v2) - (v1 * y2) - (v0 * y1) - (y0 * v2);
                c = (u0 * x1) + (x0 * u2) + (u1 * x2) - (x1 * u2) - (x0 * u1) - (u0 * x2);
                d = (u0 * y1) + (y0 * u2) + (u1 * y2) - (y1 * u2) - (y0 * u1) - (u0 * y2);
                tx = (u0 * v1 * x2) + (v0 * x1 * u2) + (x0 * u1 * v2) - (x0 * v1 * u2) - (v0 * u1 * x2) - (u0 * x1 * v2);
                ty = (u0 * v1 * y2) + (v0 * y1 * u2) + (y0 * u1 * v2) - (y0 * v1 * u2) - (v0 * u1 * y2) - (u0 * y1 * v2);
                context.transform(a * ratio, b * ratio, c * ratio, d * ratio, tx * ratio, ty * ratio);
                if (rotated) {
                    context.transform(0, -1, 1, 0, 0, _destWidth);
                }
                context.drawImage(image.source, sourceX, sourceY, _sourceWidth, _sourceHeight, offsetX + context.$offsetX, offsetY + context.$offsetY, _destWidth, _destHeight);
                context.restore();
                drawCalls++;
            }

            return drawCalls;
        }

        public renderText(node: sys.TextNode, context: CanvasRenderingContext2D): void {
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.lineJoin = 'round';//确保描边样式是圆角
            const drawData = node.drawData;
            const length = drawData.length;
            let pos = 0;
            while (pos < length) {
                const x = drawData[pos++];
                const y = drawData[pos++];
                const text = drawData[pos++];
                const format: sys.TextFormat = drawData[pos++];
                context.font = getFontString(node, format);
                const textColor = format.textColor == null ? node.textColor : format.textColor;
                const strokeColor = format.strokeColor == null ? node.strokeColor : format.strokeColor;
                const stroke = format.stroke == null ? node.stroke : format.stroke;
                context.fillStyle = toColorString(textColor);
                context.strokeStyle = toColorString(strokeColor);
                if (stroke) {
                    context.lineWidth = stroke * 2;
                    context.strokeText(text, x + context.$offsetX, y + context.$offsetY);
                }
                context.fillText(text, x + context.$offsetX, y + context.$offsetY);
            }
        }

        private renderingMask = false;

        /**
         * @private
         */
        public renderGraphics(node: sys.GraphicsNode, context: CanvasRenderingContext2D, forHitTest?: boolean): number {
            const drawData = node.drawData;
            const length = drawData.length;
            forHitTest = !!forHitTest;
            for (let i = 0; i < length; i++) {
                const path: sys.Path2D = drawData[i];
                switch (path.type) {
                    case sys.PathType.Fill:
                        const fillPath = <sys.FillPath>path;
                        context.fillStyle = forHitTest ? BLACK_COLOR : getRGBAString(fillPath.fillColor, fillPath.fillAlpha);
                        this.renderPath(path, context);
                        if (this.renderingMask) {
                            context.clip();
                        }
                        else {
                            context.fill();
                        }
                        break;
                    case sys.PathType.GradientFill:
                        const g = <sys.GradientFillPath>path;
                        context.fillStyle = forHitTest ? BLACK_COLOR : getGradient(context, g.gradientType, g.colors, g.alphas, g.ratios, g.matrix);
                        context.save();
                        const m = g.matrix;
                        this.renderPath(path, context);
                        context.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
                        context.fill();
                        context.restore();
                        break;
                    case sys.PathType.Stroke:
                        const strokeFill = <sys.StrokePath>path;
                        const lineWidth = strokeFill.lineWidth;
                        context.lineWidth = lineWidth;
                        context.strokeStyle = forHitTest ? BLACK_COLOR : getRGBAString(strokeFill.lineColor, strokeFill.lineAlpha);
                        context.lineCap = CAPS_STYLES[strokeFill.caps];
                        context.lineJoin = strokeFill.joints as CanvasLineJoin;
                        context.miterLimit = strokeFill.miterLimit;
                        if (context.setLineDash) {
                            context.setLineDash(strokeFill.lineDash);
                        }
                        //对1像素和3像素特殊处理，向右下角偏移0.5像素，以显示清晰锐利的线条。
                        const isSpecialCaseWidth = lineWidth === 1 || lineWidth === 3;
                        if (isSpecialCaseWidth) {
                            context.translate(0.5, 0.5);
                        }
                        this.renderPath(path, context);
                        context.stroke();
                        if (isSpecialCaseWidth) {
                            context.translate(-0.5, -0.5);
                        }
                        break;
                }
            }
            return length == 0 ? 0 : 1;
        }

        private renderPath(path: sys.Path2D, context: CanvasRenderingContext2D): void {
            context.beginPath();
            const data = path.$data;
            const commands = path.$commands;
            const commandCount = commands.length;
            let pos = 0;
            for (let commandIndex = 0; commandIndex < commandCount; commandIndex++) {
                const command = commands[commandIndex];
                switch (command) {
                    case sys.PathCommand.CubicCurveTo:
                        context.bezierCurveTo(data[pos++] + context.$offsetX, data[pos++] + context.$offsetY, data[pos++] + context.$offsetX, data[pos++] + context.$offsetY, data[pos++] + context.$offsetX, data[pos++] + context.$offsetY);
                        break;
                    case sys.PathCommand.CurveTo:
                        context.quadraticCurveTo(data[pos++] + context.$offsetX, data[pos++] + context.$offsetY, data[pos++] + context.$offsetX, data[pos++] + context.$offsetY);
                        break;
                    case sys.PathCommand.LineTo:
                        context.lineTo(data[pos++] + context.$offsetX, data[pos++] + context.$offsetY);
                        break;
                    case sys.PathCommand.MoveTo:
                        context.moveTo(data[pos++] + context.$offsetX, data[pos++] + context.$offsetY);
                        break;
                }
            }
        }

        private renderGroup(groupNode: sys.GroupNode, context: CanvasRenderingContext2D): number {
            const m = groupNode.matrix;
            let saved = false;
            let offsetX;
            let offsetY;
            if (m) {
                context.save();
                saved = true;
                if (context.$offsetX != 0 || context.$offsetY != 0) {
                    context.translate(context.$offsetX, context.$offsetY);
                    offsetX = context.$offsetX;
                    offsetY = context.$offsetY;
                    context.$offsetX = context.$offsetY = 0;
                }
                context.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
            }

            let drawCalls: number = 0;
            const children = groupNode.drawData;
            const length = children.length;
            for (let i = 0; i < length; i++) {
                const node: sys.RenderNode = children[i];
                drawCalls += this.renderNode(node, context);
            }

            if (saved) {
                context.restore();
            }
            if (offsetX) {
                context.$offsetX = offsetX;
            }
            if (offsetY) {
                context.$offsetY = offsetY;
            }
            return drawCalls;
        }

        private createRenderBuffer(width: number, height: number, useForFilters?: boolean): sys.RenderBuffer {
            let buffer = useForFilters ? renderBufferPool_Filters.pop() : renderBufferPool.pop();
            if (buffer) {
                buffer.resize(width, height, true);
            }
            else {
                buffer = new sys.CanvasRenderBuffer(width, height);
            }
            return buffer;
        }

        public renderClear() {

        }
    }

    /**
     * @private
     * 获取字体字符串
     */
    export function getFontString(node: sys.TextNode, format: sys.TextFormat): string {
        const italic: boolean = format.italic == null ? node.italic : format.italic;
        const bold: boolean = format.bold == null ? node.bold : format.bold;
        const size: number = format.size == null ? node.size : format.size;
        const fontFamily: string = format.fontFamily || node.fontFamily;
        let font: string = italic ? 'italic ' : 'normal ';
        font += bold ? 'bold ' : 'normal ';
        font += size + 'px ' + fontFamily;
        return font;
    }

    /**
     * @private
     * 获取RGBA字符串
     */
    export function getRGBAString(color: number, alpha: number): string {
        const red = color >> 16;
        const green = (color >> 8) & 0xFF;
        const blue = color & 0xFF;
        return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
    }

    /**
     * @private
     * 获取渐变填充样式对象
     */
    function getGradient(context: CanvasRenderingContext2D, type: string, colors: number[],
        alphas: number[], ratios: number[], matrix: Matrix): CanvasGradient {
        let gradient: CanvasGradient;
        if (type == GradientType.LINEAR) {
            gradient = context.createLinearGradient(-1, 0, 1, 0);
        }
        else {
            gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        }
        //todo colors alphas ratios数量不一致情况处理
        const l = colors.length;
        for (let i = 0; i < l; i++) {
            gradient.addColorStop(ratios[i] / 255, getRGBAString(colors[i], alphas[i]));
        }
        return gradient;
    }

    // 判断浏览器是否支持 Uint8ClampedArray
    let use8Clamp = false;
    try {
        use8Clamp = (typeof Uint8ClampedArray !== undefined);
    } catch (e) { }

    function setArray(a, b, index: number = 0): void {
        for (let i = 0, l = b.length; i < l; i++) {
            a[i + index] = b[i];
        }
    }

    /**
     * @private
     */
    function colorFilter(buffer, w, h, matrix) {
        const r0 = matrix[0], r1 = matrix[1], r2 = matrix[2], r3 = matrix[3], r4 = matrix[4];
        const g0 = matrix[5], g1 = matrix[6], g2 = matrix[7], g3 = matrix[8], g4 = matrix[9];
        const b0 = matrix[10], b1 = matrix[11], b2 = matrix[12], b3 = matrix[13], b4 = matrix[14];
        const a0 = matrix[15], a1 = matrix[16], a2 = matrix[17], a3 = matrix[18], a4 = matrix[19];
        for (let p = 0, e = w * h * 4; p < e; p += 4) {
            const r = buffer[p + 0];
            const g = buffer[p + 1];
            const b = buffer[p + 2];
            const a = buffer[p + 3];

            buffer[p + 0] = r0 * r + r1 * g + r2 * b + r3 * a + r4;
            buffer[p + 1] = g0 * r + g1 * g + g2 * b + g3 * a + g4;
            buffer[p + 2] = b0 * r + b1 * g + b2 * b + b3 * a + b4;
            buffer[p + 3] = a0 * r + a1 * g + a2 * b + a3 * a + a4;
        }
    }

    /**
     * @private
     */
    function blurFilter(buffer, w, h, blurX, blurY) {
        blurFilterH(buffer, w, h, blurX);
        blurFilterV(buffer, w, h, blurY);
    }

    /**
     * @private
     */
    function blurFilterH(buffer, w, h, blurX) {
        let lineBuffer;
        if (use8Clamp) {
            lineBuffer = new Uint8ClampedArray(w * 4);
        } else {
            lineBuffer = new Array(w * 4);
        }
        const lineSize = w * 4;
        const windowLength = (blurX * 2) + 1;
        const windowSize = windowLength * 4;
        for (let y = 0; y < h; y++) {
            const pLineStart = y * lineSize;
            let rs = 0, gs = 0, bs = 0, _as = 0, alpha = 0, alpha2 = 0;
            // Fill window
            for (let ptr = -blurX * 4, end = blurX * 4 + 4; ptr < end; ptr += 4) {
                const key = pLineStart + ptr;
                if (key < pLineStart || key >= pLineStart + lineSize) {
                    continue;
                }
                alpha = buffer[key + 3];
                rs += buffer[key + 0] * alpha;
                gs += buffer[key + 1] * alpha;
                bs += buffer[key + 2] * alpha;
                _as += alpha;
            }
            // Slide window
            for (let ptr = pLineStart, end = pLineStart + lineSize, linePtr = 0, lastPtr = ptr - blurX * 4, nextPtr = ptr + (blurX + 1) * 4; ptr < end; ptr += 4, linePtr += 4, nextPtr += 4, lastPtr += 4) {

                if (_as === 0) {
                    lineBuffer[linePtr + 0] = 0;
                    lineBuffer[linePtr + 1] = 0;
                    lineBuffer[linePtr + 2] = 0;
                    lineBuffer[linePtr + 3] = 0;
                } else {
                    lineBuffer[linePtr + 0] = rs / _as;
                    lineBuffer[linePtr + 1] = gs / _as;
                    lineBuffer[linePtr + 2] = bs / _as;
                    lineBuffer[linePtr + 3] = _as / windowLength;
                }

                alpha = buffer[nextPtr + 3];
                alpha2 = buffer[lastPtr + 3];

                if (alpha || alpha == 0) {
                    if (alpha2 || alpha2 == 0) {
                        rs += buffer[nextPtr + 0] * alpha - buffer[lastPtr + 0] * alpha2;
                        gs += buffer[nextPtr + 1] * alpha - buffer[lastPtr + 1] * alpha2;
                        bs += buffer[nextPtr + 2] * alpha - buffer[lastPtr + 2] * alpha2;
                        _as += alpha - alpha2;
                    } else {
                        rs += buffer[nextPtr + 0] * alpha;
                        gs += buffer[nextPtr + 1] * alpha;
                        bs += buffer[nextPtr + 2] * alpha;
                        _as += alpha;
                    }
                } else {
                    if (alpha2 || alpha2 == 0) {
                        rs += -buffer[lastPtr + 0] * alpha2;
                        gs += -buffer[lastPtr + 1] * alpha2;
                        bs += -buffer[lastPtr + 2] * alpha2;
                        _as += -alpha2;
                    } else {
                        // do nothing
                    }
                }
            }
            // Copy line
            if (use8Clamp) {
                buffer.set(lineBuffer, pLineStart);
            } else {
                setArray(buffer, lineBuffer, pLineStart);
            }
        }
    }

    /**
     * @private
     */
    function blurFilterV(buffer, w, h, blurY) {
        let columnBuffer;
        if (use8Clamp) {
            columnBuffer = new Uint8ClampedArray(h * 4);
        } else {
            columnBuffer = new Array(h * 4);
        }
        const stride = w * 4;
        const windowLength = (blurY * 2) + 1;
        for (let x = 0; x < w; x++) {
            const pColumnStart = x * 4;
            let rs = 0, gs = 0, bs = 0, _as = 0, alpha = 0, alpha2 = 0;
            // Fill window
            for (let ptr = -blurY * stride, end = blurY * stride + stride; ptr < end; ptr += stride) {
                const key = pColumnStart + ptr;
                if (key < pColumnStart || key >= pColumnStart + h * stride) {
                    continue;
                }
                alpha = buffer[key + 3];
                rs += buffer[key + 0] * alpha;
                gs += buffer[key + 1] * alpha;
                bs += buffer[key + 2] * alpha;
                _as += alpha;
            }
            // Slide window
            for (let ptr = pColumnStart, end = pColumnStart + h * stride, columnPtr = 0, lastPtr = pColumnStart - blurY * stride, nextPtr = pColumnStart + ((blurY + 1) * stride); ptr < end; ptr += stride, columnPtr += 4, nextPtr += stride, lastPtr += stride) {

                if (_as === 0) {
                    columnBuffer[columnPtr + 0] = 0;
                    columnBuffer[columnPtr + 1] = 0;
                    columnBuffer[columnPtr + 2] = 0;
                    columnBuffer[columnPtr + 3] = 0;
                } else {
                    columnBuffer[columnPtr + 0] = rs / _as;
                    columnBuffer[columnPtr + 1] = gs / _as;
                    columnBuffer[columnPtr + 2] = bs / _as;
                    columnBuffer[columnPtr + 3] = _as / windowLength;
                }

                alpha = buffer[nextPtr + 3];
                alpha2 = buffer[lastPtr + 3];

                if (alpha || alpha == 0) {
                    if (alpha2 || alpha2 == 0) {
                        rs += buffer[nextPtr + 0] * alpha - buffer[lastPtr + 0] * alpha2;
                        gs += buffer[nextPtr + 1] * alpha - buffer[lastPtr + 1] * alpha2;
                        bs += buffer[nextPtr + 2] * alpha - buffer[lastPtr + 2] * alpha2;
                        _as += alpha - alpha2;
                    } else {
                        rs += buffer[nextPtr + 0] * alpha;
                        gs += buffer[nextPtr + 1] * alpha;
                        bs += buffer[nextPtr + 2] * alpha;
                        _as += alpha;
                    }
                } else {
                    if (alpha2 || alpha2 == 0) {
                        rs += -buffer[lastPtr + 0] * alpha2;
                        gs += -buffer[lastPtr + 1] * alpha2;
                        bs += -buffer[lastPtr + 2] * alpha2;
                        _as += -alpha2;
                    } else {
                        // do nothing
                    }
                }
            }
            // Copy column
            for (let i = x * 4, end = i + h * stride, j = 0; i < end; i += stride, j += 4) {
                buffer[i + 0] = columnBuffer[j + 0];
                buffer[i + 1] = columnBuffer[j + 1];
                buffer[i + 2] = columnBuffer[j + 2];
                buffer[i + 3] = columnBuffer[j + 3];
            }
        }
    }

    // function glowFilter(buffer, w, h, color, blurX, blurY, strength) {
    //     dropShadowFilter(buffer, w, h, color, blurX, blurY, 0, 0, strength)
    // }

    function dropShadowFilter(buffer, w, h, color, blurX, blurY, angle, distance, strength) {
        const tmp = alphaFilter(buffer, color);
        panFilter(tmp, w, h, angle, distance);
        blurFilter(tmp, w, h, blurX, blurY);
        scaleAlphaChannel(tmp, strength);
        compositeSourceOver(tmp, buffer);
        buffer.set(tmp);
        if (use8Clamp) {
            buffer.set(tmp);
        } else {
            setArray(buffer, tmp);
        }
    }

    function alphaFilter(buffer, color) {
        if (!color) {
            color = [0, 0, 0, 0];
        }
        let plane;
        if (use8Clamp) {
            plane = new Uint8ClampedArray(buffer);
        } else {
            plane = new Array(buffer.length);
            setArray(plane, buffer);
        }
        const colorR = color[0];
        const colorG = color[1];
        const colorB = color[2];
        const colorA = color[3];
        for (let ptr = 0, end = plane.length; ptr < end; ptr += 4) {
            const alpha = plane[ptr + 3];
            plane[ptr + 0] = colorR * alpha;
            plane[ptr + 1] = colorG * alpha;
            plane[ptr + 2] = colorB * alpha;
            plane[ptr + 3] = colorA * alpha;
        }
        return plane;
    }

    function panFilter(buffer, w, h, angle, distance) {
        const dy = (Math.sin(angle) * distance) | 0;
        const dx = (Math.cos(angle) * distance) | 0;

        let oldBuffer, newBuffer;
        if (use8Clamp) {
            oldBuffer = new Int32Array(buffer.buffer);
            newBuffer = new Int32Array(oldBuffer.length);

            for (let oy = 0; oy < h; oy++) {
                const ny = oy + dy;
                if (ny < 0 || ny > h) {
                    continue;
                }
                for (let ox = 0; ox < w; ox++) {
                    const nx = ox + dx;
                    if (nx < 0 || nx > w) {
                        continue;
                    }
                    newBuffer[ny * w + nx] = oldBuffer[oy * w + ox];
                }
            }

            oldBuffer.set(newBuffer);
        } else {
            oldBuffer = buffer;
            newBuffer = new Array(oldBuffer.length);

            for (let oy = 0; oy < h; oy++) {
                const ny = oy + dy;
                if (ny < 0 || ny > h) {
                    continue;
                }
                for (let ox = 0; ox < w; ox++) {
                    const nx = ox + dx;
                    if (nx < 0 || nx > w) {
                        continue;
                    }
                    newBuffer[(ny * w + nx) * 4 + 0] = oldBuffer[(oy * w + ox) * 4 + 0];
                    newBuffer[(ny * w + nx) * 4 + 1] = oldBuffer[(oy * w + ox) * 4 + 1];
                    newBuffer[(ny * w + nx) * 4 + 2] = oldBuffer[(oy * w + ox) * 4 + 2];
                    newBuffer[(ny * w + nx) * 4 + 3] = oldBuffer[(oy * w + ox) * 4 + 3];
                }
            }

            setArray(oldBuffer, newBuffer);
        }
    }

    function scaleAlphaChannel(buffer, value) {
        for (let ptr = 0, end = buffer.length; ptr < end; ptr += 4) {
            buffer[ptr + 3] *= value;
        }
    }

    function compositeSourceOver(dst, src) {
        for (let ptr = 0, end = dst.length; ptr < end; ptr += 4) {
            const Dr = dst[ptr + 0];
            const Dg = dst[ptr + 1];
            const Db = dst[ptr + 2];
            const Da = dst[ptr + 3] / 255;

            const Sr = src[ptr + 0];
            const Sg = src[ptr + 1];
            const Sb = src[ptr + 2];
            const Sa = src[ptr + 3] / 255;

            dst[ptr + 0] = Sr + Dr * (1 - Sa);
            dst[ptr + 1] = Sg + Dg * (1 - Sa);
            dst[ptr + 2] = Sb + Db * (1 - Sa);
            dst[ptr + 3] = (Sa + Da * (1 - Sa)) * 255;
        }
    }

    function getPixelKey(w, x, y) {
        return y * w * 4 + x * 4;
    }

    function mix(v1, v2, rate) {
        return v1 * (1 - rate) + v2 * rate;
    }

    // dropShadowFilter2
    // 模拟shader中的算法，可以实现内发光，挖空等高级效果
    function dropShadowFilter2(buffer, w, h, color, blurX, blurY, angle, distance, strength, inner, knockout, hideObject) {
        let plane;
        if (use8Clamp) {
            plane = new Uint8ClampedArray(buffer.length);
        } else {
            plane = new Array(buffer.length);
        }

        const alpha = color[3];

        let curDistanceX = 0;
        let curDistanceY = 0;
        const offsetX = distance * Math.cos(angle);
        const offsetY = distance * Math.sin(angle);

        const linearSamplingTimes = 7.0;
        const circleSamplingTimes = 12.0;
        const PI = 3.14159265358979323846264;
        let cosAngle;
        let sinAngle;

        const stepX = blurX / linearSamplingTimes;
        const stepY = blurY / linearSamplingTimes;

        // 遍历像素
        for (let u = 0; u < w; u++) {
            for (let v = 0; v < h; v++) {

                // 此处为了避免毛刺可以添加一个随机值
                const offset = 0;

                // 处理单个像素
                const key = v * w * 4 + u * 4;
                let totalAlpha = 0;
                let maxTotalAlpha = 0;

                // 采样出来的色值
                const _r = buffer[key + 0] / 255;
                const _g = buffer[key + 1] / 255;
                const _b = buffer[key + 2] / 255;
                let _a = buffer[key + 3] / 255;

                for (let a = 0; a <= PI * 2; a += PI * 2 / circleSamplingTimes) {
                    cosAngle = Math.cos(a + offset);
                    sinAngle = Math.sin(a + offset);
                    for (let i = 0; i < linearSamplingTimes; i++) {
                        curDistanceX = i * stepX * cosAngle;
                        curDistanceY = i * stepY * sinAngle;
                        const _u = Math.round(u + curDistanceX - offsetX);
                        const _v = Math.round(v + curDistanceY - offsetY);
                        let __a = 0;
                        if (_u >= w || _u < 0 || _v < 0 || _v >= h) {
                            __a = 0;
                        }
                        else {
                            const _key = _v * w * 4 + _u * 4;
                            __a = buffer[_key + 3] / 255;
                        }
                        totalAlpha += (linearSamplingTimes - i) * __a;
                        maxTotalAlpha += (linearSamplingTimes - i);
                    }
                }

                _a = Math.max(_a, 0.0001);
                // 'ownColor.rgb = ownColor.rgb / ownColor.a;',

                const outerGlowAlpha = (totalAlpha / maxTotalAlpha) * strength * alpha * (1. - inner) * Math.max(Math.min(hideObject, knockout), 1. - _a);
                const innerGlowAlpha = ((maxTotalAlpha - totalAlpha) / maxTotalAlpha) * strength * alpha * inner * _a;

                _a = Math.max(_a * knockout * (1 - hideObject), 0.0001);

                const rate1 = innerGlowAlpha / (innerGlowAlpha + _a);
                const r1 = mix(_r, color[0], rate1);
                const g1 = mix(_g, color[1], rate1);
                const b1 = mix(_b, color[2], rate1);

                const rate2 = outerGlowAlpha / (innerGlowAlpha + _a + outerGlowAlpha);
                const r2 = mix(r1, color[0], rate2);
                const g2 = mix(g1, color[1], rate2);
                const b2 = mix(b1, color[2], rate2);

                const resultAlpha = Math.min(_a + outerGlowAlpha + innerGlowAlpha, 1);

                // 赋值颜色
                plane[key + 0] = r2 * 255;
                plane[key + 1] = g2 * 255;
                plane[key + 2] = b2 * 255;
                plane[key + 3] = resultAlpha * 255;

            }
        }

        if (use8Clamp) {
            buffer.set(plane);
        } else {
            setArray(buffer, plane);
        }
    }
}
