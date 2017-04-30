function Draw(transactionSystem, div, controlPanel) {
    var self = this;
    this.moduleName = 'draw';    //enroll module name in transaction system
    var canvas = $('<canvas id="draw-canvas" ></canvas>');
    var drawList = [];           //record all the draw history in this class
    var currentIndex = -1;
    var ignoreTransaction = {};  //Instructor ignore the draw transaction that himself made
    var fabricCanvas = null;     //fabric canvas from fabricjs lib
    var pen = null,      //init all the button
        undo = null,
        redo = null,
        eraser = null,
        clear = null,
        colorPicker = null;

    var scale = 1;
    var lastHeight = 0;
    div.append(canvas);
    div.attr('id', 'canvas-div');

    /**
     * init after transaction system
     */
    this.init = function () {
        pen = controlPanel.find('#pencil-box'),      //init all the button
            undo = controlPanel.find('#undo-box'),
            redo = controlPanel.find('#repeat-box'),
            eraser = controlPanel.find('#eraser-box'),
            clear = controlPanel.find('#clear-box'),
            colorPicker = controlPanel.find('#draw-color-picker');
        canvas = new fabric.Canvas('draw-canvas', {isDrawingMode: true});
        div.find('.canvas-container').css('position', 'absolute');
        div.find('.canvas-container').css('height', '100%');
        div.find('.canvas-container').css('width', '100%');
        div.find('canvas').css('position', 'absolute');
        div.find('canvas').css('height', '100%');
        div.find('canvas').css('width', '100%');
        fabric.Object.prototype.transparentCorners = false;
        canvas.setHeight(div.height());
        canvas.isDrawingMode = false;
        canvas.freeDrawingBrush.color = colorPicker.val();
        canvas.setWidth(div.width());
        lastHeight  = div.height();
        canvas.on('object:added', function () {            //add handler to event add obj
            self.newStroke(JSON.stringify(canvas));
        });
        document.addEventListener(events.slidesChange.type, function () {
            drawList = [];
            currentIndex = -1;
            canvas.clear();
        });
        document.addEventListener(events.viewSizeChange.type, function () {
            resize();

        });
        attachUIHandler();
    };

    function resize() {
        // TODO limit the max canvas zoom in
        scaleFactor =  div.height()/lastHeight;

        canvas.setHeight(canvas.getHeight() * scaleFactor);
        canvas.setWidth(canvas.getWidth() * scaleFactor);

        var objects = canvas.getObjects();
        for (var i in objects) {
            var scaleX = objects[i].scaleX;
            var scaleY = objects[i].scaleY;
            var left = objects[i].left;
            var top = objects[i].top;

            var tempScaleX = scaleX * scaleFactor;
            var tempScaleY = scaleY * scaleFactor;
            var tempLeft = left * scaleFactor;
            var tempTop = top * scaleFactor;

            objects[i].scaleX = tempScaleX;
            objects[i].scaleY = tempScaleY;
            objects[i].left = tempLeft;
            objects[i].top = tempTop;

            objects[i].setCoords();
        }
        lastHeight = div.height();
        canvas.renderAll();
    }

    /**
     * attach all UI Handler after all the UI init
     */
    var attachUIHandler = function () {
        /**
         * change color when value of color picker change
         */
        colorPicker.change ( function () {
            canvas.freeDrawingBrush.color = colorPicker.val();
        });
        /**
         * clear all content on the canvas
         */
        clear.click(function () {
            canvas.clear();
            self.newStroke(JSON.stringify(canvas));
        });

        /**
         * click to erase selected object
         */
        eraser.click(function () {
            canvas.isDrawingMode = false;
            canvas.on('object:selected', function () {
                canvas.getActiveObject().remove();
                self.newStroke(JSON.stringify(canvas));
            })
        });

        /**
         * change to draw mode
         */
        pen.click(function () {
            canvas.isDrawingMode = true;
        });

        /**
         * undo to previous draw
         */
        undo.click(function () {
            if (currentIndex > 0) {
                canvas.clear();
                canvas.loadFromJSON(drawList[--currentIndex]);
                canvas.renderAll();
                self.newStroke(JSON.stringify(canvas));
            }
        });

        /**
         * redo a draw
         */
        redo.click(function () {
            if (currentIndex < drawList.length - 1) {
                canvas.clear();
                canvas.loadFromJSON(drawList[++currentIndex]);
                canvas.renderAll();
                self.newStroke(JSON.stringify(canvas));
            }
        });
    };
    /**
     * send the transaction to all the students
     * @param stroke a json obj contain all the obj in the canvas
     */
    this.newStroke = function (stroke) {
        var id = Math.random();
        ignoreTransaction[id] = true;
        transactionSystem.newTransaction(self.moduleName, {
            type: 'stroke',
            id: id
        }, {stroke: stroke}).then(function (result) {
            currentIndex++;
            drawList.push(stroke);
            canvas.clear();
            canvas.loadFromJSON(stroke);
            canvas.renderAll();
        }).catch(function (err) {
            console.error('fail to new transaction');
            console.error(err);
            delete ignoreTransaction[id];
        });
    };

    /**
     * get draw transaction from instructor and update to canvas
     * @param index
     * @param description
     * @param createdBy
     * @param createdAt
     * @param payload
     */
    this.update = function (index, description, createdBy, createdAt, payload) {
        if (ignoreTransaction[description.id]) {
            delete ignoreTransaction[description.id];
            return;
        }
        drawList.push(payload.stroke);
        canvas.clear();
        canvas.loadFromJSON(payload.stroke);
        canvas.clear();
    };

    /**
     * reset all the init varible
     */
    this.reset = function () {
        ignoreTransaction = {};
        drawList = [];

    };

}