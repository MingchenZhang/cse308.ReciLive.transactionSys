function Draw(transactionSystem, canvas, controlPanel) {
    var self = this;
    this.moduleName = 'draw';    //enroll module name in transaction system
    var drawList = [];           //record all the draw history in this class
    var ignoreTransaction = {};  //Instructor ignore the draw transaction that himself made
    var fabricCanvas = null;     //fabric canvas from fabricjs lib
    var drawMode = controlPanel.find('fa fa-pencil'),

    /*
    * init after transaction system
    */
    this.init = function(){
        canvas.setAttribute('id','draw-canvas')
        fabricCanvas = new new fabric.Canvas('draw-canvas',{isDrawingMode:true});
        fabric.Object.prototype.transparentCorners = false;
        var
    };

    this.newStroke = function (stroke) {
        var id = Math.random();
        ignoreTransaction[id] = true;
        transactionSystem.newTransaction(self.moduleName, {
            type: 'stroke',
            id: id
        }, {stroke: stroke}).then(function (result) {
            drawList.push(stroke);
            showDiv.prepend($('<p/>').html(stroke));
        }).catch(function (err) {
            console.error('fail to new transaction');
            console.error(err);
            delete ignoreTransaction[id];
        });
    };

    this.update = function (index, description, createdBy, createdAt, payload) {
        if(ignoreTransaction[description.id]){
            delete ignoreTransaction[description.id];
            return;
        }
        drawList.push(payload.stroke);
        showDiv.prepend($('<p/>').html(payload.stroke));
    };
    this.reset = function () {
        ignoreTransaction = {};
        drawList = [];
        showDiv.empty();
    };

    sendButton.click(function () {
        console.log('sending:'+sendText.val());
        self.newStroke(sendText.val());
    });
}