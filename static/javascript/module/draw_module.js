function Draw(transactionSystem, canvas, controlPanel) {
    var self = this;
    this.moduleName = 'draw';    //enroll module name in transaction system
    var drawList = [];           //record all the draw history in this class
    var currentIndex = -1;
    var ignoreTransaction = {};  //Instructor ignore the draw transaction that himself made
    var fabricCanvas = null;     //fabric canvas from fabricjs lib
    var pen = controlPanel.find('.fa fa-pencil'),      //init all the button
        undo = controlPanel.find('.fa fa-undo'),
        redo = controlPanel.find('.fa fa-repeat'),
        eraser = controlPanel.find('.fa fa-eraser'),
        clear = controlPanel.find('.fa fa-clear');

    /**
     * init after transaction system
     */
    this.init = function () {
        canvas.setAttribute('id', 'draw-canvas')
        fabricCanvas = new new fabric.Canvas('draw-canvas', {isDrawingMode: true});
        fabric.Object.prototype.transparentCorners = false;
        canvas.on('object:added', function () {            //add handler to event add obj
            self.newStroke(JSON.stringify(canvas));
        })
    };
    /**
     * clear all content on the canvas
     */
    clear.onclick = function () {
        canvas.clear();
        self.newStroke(JSON.stringify(canvas));
    };
    /**
     * click to erase selected object
     */
    eraser.onclick = function () {
        canvas.isDrawMode = false;
        canvas.on('object:selected', function () {
            canvas.getActiveObject().remove();
            self.newStroke(JSON.stringify(canvas));
        })
    };

    /**
     * change to draw mode
     */
    pen.onclick = function () {
        canvas.isDrawMode = true;
    };

    /**
     * undo to previous draw
     */
    undo.onclick = function () {
        if (currentIndex > 0) {
            canvas.clear();
            canvas.loadFromJSON(drawList[--currentIndex]);
            canvas.renderAll();
            self.newStroke(JSON.stringify(canvas));
        }
    };

    /**
     * redo a draw
     */
    redo.onclick = function () {
        if (currentIndex < drawList.length - 1) {
            canvas.clear();
            canvas.loadFromJSON(drawList[++currentIndex]);
            canvas.renderAll();
            self.newStroke(JSON.stringify(canvas));
        }
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
        showDiv.empty();
    };

}