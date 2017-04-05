function Slide(transactionSystem, showCanvas, previousButton, nextButton) {

    var self = this;
    self.moduleName = 'slides';
    self.slideList = [];
    self.ignoreTransaction = {};
    self.currentSlidesNumber = -1;
    self.workCanvas = document.createElement('canvas');

    self.reset = function () {
        ignoreTransaction = {};
        self.slideList = [];
        showCanvas.empty();
    };

    function showImage(img, showCanvas) {
        let ctx = showCanvas.get(0).getContext("2d");
        ctx.clearRect(0, 0, showCanvas.width(), showCanvas.height());
        ctx.drawImage(img, 0, 0);
    }

    //as receiver
    self.update = function (index, description, createdBy, createdAt, payload) {
        if (self.ignoreTransaction[description.id]) {
            delete self.ignoreTransaction[description.id];
            return;
        }
        var img = new Image();
        img.src = payload.slideImage;
        self.slideList.push(img);
        showImage(img, showCanvas);
    };

    self.init = function () {
        if (transactionSystem.privilege.indexOf("slides") != -1) var asController = 1;
        if (asController) {
            //as controller of slides
            self.loadAllSlides = function () {
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
                return loadSlideFromURLList({URLList: ['/static/dummy_data/slides/1.png', '/static/dummy_data/slides/2.png', '/static/dummy_data/slides/3.png', '/static/dummy_data/slides/4.png']});
            };

            self.newSlide = function (slideImage) {
                var id = Math.random();
                self.ignoreTransaction[id] = true;
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
            function getURI(img) {
                let ctx = self.workCanvas.getContext('2d');
                ctx.clearRect(0, 0, self.workCanvas.width, self.workCanvas.height);
                ctx.drawImage(img, 0, 0);
                self.slide64 = self.workCanvas.toDataURL();
            }

            previousButton.on('click', function () {
                if (self.currentSlidesNumber - 1 > -1) {
                    self.newSlide(self.slideList[--self.currentSlidesNumber]);
                    console.log("previous slide\n current slide number :", self.currentSlidesNumber);
                }
                else {
                    console.log("no previous slide\n");
                }
            });
            nextButton.on('click', function () {
                if (self.currentSlidesNumber + 1 < self.slideList.length) {
                    self.newSlide(self.slideList[++self.currentSlidesNumber]);
                    console.log("next slide\n current slide number :", self.currentSlidesNumber);
                }
                else {
                    console.log("no next slide\n");
                }
            });
            return addDummySlides().then(function () {
                self.newSlide(self.slideList[++self.currentSlidesNumber])
            });
        } else {
            return new Promise(function (resolve, reject) {
                resolve();

            })

        }


    }
}