function Slide(transactionSystem, showDiv, sendButton, sendSlide) {
    var self = this;
    this.moduleName = 'slide';
    self.currentSlide;
    var slideList = [];
    var ignoreTransaction = {};
    sendSlide.on('change', () => {
        self.currentSlide = sendSlide.prop('files');
    });
    this.newSlide = function (slideImage) {
        var id = Math.random();
        ignoreTransaction[id] = true;
        transactionSystem.newTransaction(self.moduleName, {
            type: 'slide',
            id: id
        }, {slideImage: slideImage}).then(function (result) {
            slideList.push(slideImage);
            return showImage(slideImage, showDiv);

        }).catch(function (err) {
            console.error('fail to new transaction');
            console.error(err);
            delete ignoreTransaction[id];
        });
    };
    this.update = function (index, description, createdBy, createdAt, payload) {
        if (ignoreTransaction[description.id]) {
            delete ignoreTransaction[description.id];
            return;
        }
        slideList.push(payload.slideImage);
        showImage(payload.slideImage, showDiv);
    };
    this.reset = function () {
        ignoreTransaction = {};
        slideList = [];
        showDiv.empty();
    };

    sendButton.click(function () {
        console.log('image:' + this.id);
        self.newSlide(self.currentSlide);
    });
function showImage(file, showDiv){
    var img = new Image();
    img.src = file;
    showDiv.prepend(img);
}


}