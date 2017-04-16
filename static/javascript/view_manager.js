//view manager control the ratio of the whole div and the push message to different module
function view(stageDiv) {
var imgDiv = stageDiv.find('#img-div');
var canvasDiv = stageDiv.find('#canvas-div');
var sliderDiv = stageDiv.find('#slider-div');
    this.init = function()
    {
        stageDiv.css('position','relative');
        imgDiv.css('position','absolute');
        canvasDiv.css('position','absolute');
        sliderDiv.css('position','absolute');
        imgDiv.css('height','100%');
        imgDiv.css('width','100%');
        canvasDiv.css('height','100%');
        canvasDiv.css('width','100%')
    };
}


