function Slide(transactionSystem, asController, showCanvas, previousButton, nextButton) {
    var self = this;
    this.moduleName = 'slide';
    self.slideList = [];
    var ignoreTransaction = {};
    self.currentSlidesNumber = -1;
    var workCanvas = document.createElement('canvas');
    this.loadAllSlides = function () {
        return new promise(function (resolve, reject) {
            //TODO: delete IDToken
            $.ajax({
                url: 'http://localhost/get_resource',
                type: "POST",
                data: JSON.stringify({
                    type: "slides",
                    payload: {classNumber: classroomNumber, slidesNumber: 0, StartAt: 0, EndAt: -1}
                }),
                contentType: "application/json",
                complete: resolve(response),
                error: reject(e)
            });
        }).then(
            function (response) {
                if (response.status == "error") {
                    //TODO: load error
                    return;
                } else if (response.status == "ok") {
                    return loadSlideFromURLList(response.payload);
                }
            }
        ).catch();
    };
    function loadSlideFromURLList(payload) {
        let index = 0;
        return new Promise(function (resolve, reject) {
            payload.URLList.forEach(function (url) {
                index++;
                var image = new Image();
                image.id = index;
                image.src = url;
                self.slideList.push(image);
            });
            resolve();
        });
    }

    function addDummySlides() {
        return loadSlideFromURLList({URLList:['/static/dummy_data/slides/1.png', '/static/dummy_data/slides/2.png', '/static/dummy_data/slides/3.png', '/static/dummy_data/slides/4.png']});
    };

    this.newSlide = function (slideImage) {
        var id = Math.random();
        ignoreTransaction[id] = true;
        getURI(slideImage);
        transactionSystem.newTransaction(self.moduleName, {
            type: 'slide',
            id: id
        }, {slideImage: self.slide64}).then(function (result) {
            showImage(slideImage, showCanvas);
        }).catch(function (err) {
            console.error('fail to new transaction');
            console.error(err);
            delete ignoreTransaction[id];
        });
    };

    this.update = function (index, description, createdBy, createdAt, payload) {
        if (ignoreTransaction[description.id] || asController) {
            delete ignoreTransaction[description.id];
            return;
        }
        var img = new Image();
        img.src = payload.slideImage;
        self.slideList.push(img);
        showImage(img, showCanvas);
    };
    this.reset = function () {
        ignoreTransaction = {};
        self.slideList = [];
        showCanvas.empty();
    };
    function showImage(img, showCanvas) {
        let ctx=showCanvas.get(0).getContext("2d");
        ctx.clearRect(0, 0, showCanvas.width, showCanvas.height);
        ctx.drawImage(img, 0, 0);
    }

    function getURI(img) {
        let ctx = workCanvas.getContext('2d');
        ctx.clearRect(0, 0, workCanvas.width, workCanvas.height);
        ctx.drawImage(img, 0, 0);
        self.slide64 = workCanvas.toDataURL();
    }

    previousButton.on('click', function () {
        //TODO: check if there is a previous
        self.newSlide(self.slideList[--self.currentSlidesNumber]);
        console.log("previous slide\n current slide number :", self.currentSlidesNumber);
    });
    nextButton.on('click', function () {
//TODO: check if there is a next
        self.newSlide(self.slideList[++self.currentSlidesNumber]);
        console.log("next slide\n current slide number :", self.currentSlidesNumber);
    });
    addDummySlides().then(self.newSlide(self.slideList[++self.currentSlidesNumber]));
}