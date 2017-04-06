function Slide(transactionSystem, showCanvas, previousButton, nextButton) {

    var self = this;
    self.moduleName = 'slides';
    //slideList get all transaction in order
    //
    self.slideList = [];
    //instructor slide base64 data list
    self.slideDataList = [];
    self.ignoreTransaction = {};
    self.currentSlidesNumber = -1;
    //canvas just for get URI
    //TODO: there should have a better way to get URI
    self.workCanvas = document.createElement('canvas');
    //when there are multiple slides use in one recitation
    self.slidesNumber = -1;
    //reset ignore slidelist and clean up canvas
    self.reset = function () {
        self.ignoreTransaction = {};
        self.slideList = [];
        self.slideDataList = [];
        showCanvas.empty();
    };
//clean canvas and show given img(URL or URI)
    function showImage(imgBase64, showCanvas) {
        let ctx = showCanvas.get(0).getContext("2d");
        //TODO: check if there onload problem
        let img = new Image();
        img.onload= function(){
            ctx.clearRect(0, 0, showCanvas.width(), showCanvas.height());
            ctx.drawImage(img, 0, 0);
        };
        img.src = imgBase64;
    }

    //update all the slides to front end transaction system
    self.update = function (index, description, createdBy, createdAt, payload) {
        if (self.ignoreTransaction[description.id]) {
            delete self.ignoreTransaction[description.id];
            return;
        }
        //add img to slideList by time
        showImage(payload.slideImage, showCanvas);
        self.slideList.push(payload.slideImage);
        self.currentSlidesNumber=payload.slideIndex;
    };
//init call after transaction finish load and get privilege info
    self.init = function () {
        if (transactionSystem.privilege.indexOf("slides") != -1) var asController = 1;
        if (asController) {
            //as controller of slides
            self.loadAllSlides = function (slidesIndex) {
                return new promise(function (resolve, reject) {
                    //TODO: delete IDToken
                    $.ajax({
                        url: 'http://localhost/get_resource',//TODO: change this to gae server
                        type: "POST",
                        data: JSON.stringify({
                            type: "slides",
                            index: slidesIndex,
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
                            self.slidesNumber = slidesIndex;
                            return self.loadSlideFromURLList(response.payload);
                        }
                    }
                ).catch();
            };
            self.loadSlideFromURLList = function (payload) {
                let index = -1;
                let promiseList = [];
                payload.URLList.forEach(function (url) {
                    index++;
                    let i=index;
                    var image = new Image();
                    promiseList[i] = new Promise(function (resolve, reject) {
                        image.id = i;
                        image.onload = function () {
                            //call after finish load
                            self.slideDataList[i]= {id: i, slide64: self.getURI(image)};
                            resolve();
                        };
                        image.src = url;
                    });

                });
                return promiseList;
            };

            self.addDummySlides = function () {
                return Promise.all(self.loadSlideFromURLList({URLList: ['/static/dummy_data/slides/1.png', '/static/dummy_data/slides/2.png', '/static/dummy_data/slides/3.png', '/static/dummy_data/slides/4.png']}));
            };

            self.newSlide = function (slideDataObj) {
                var id = Math.random();
                self.ignoreTransaction[id] = true;
                //load img before change to URI
                transactionSystem.newTransaction(self.moduleName, {
                    type: 'slide',
                    id: id
                }, {
                    slideImage: slideDataObj.slide64,
                    slideIndex: slideDataObj.id,
                    slidesNumber: self.slidesNumber
                })
                    .then(function (result) {
                        showImage(slideDataObj.slide64, showCanvas);
                    }).catch(function (err) {
                    console.error('fail to new transaction');
                    console.error(err);
                    delete self.ignoreTransaction[id];
                });
            };
            self.getURI = function (img) {
                let ctx = self.workCanvas.getContext('2d');
                ctx.clearRect(0, 0, self.workCanvas.width, self.workCanvas.height);
                //image is loaded by caller
                ctx.drawImage(img, 0, 0);
                console.log("loaded img ", img.id);
                return self.slide64 = self.workCanvas.toDataURL();

            };

            previousButton.on('click', function () {
                if (self.currentSlidesNumber - 1 > -1) {
                    self.newSlide(self.slideDataList[--self.currentSlidesNumber]);
                    console.log("previous slide\n current slide number :", self.currentSlidesNumber);
                }
                else {
                    console.log("no previous slide\n");
                }
            });
            nextButton.on('click', function () {
                if (self.currentSlidesNumber + 1 < self.slideDataList.length) {
                    self.newSlide(self.slideDataList[++self.currentSlidesNumber]);
                    console.log("next slide\n current slide number :", self.currentSlidesNumber);
                }
                else {
                    console.log("no next slide\n");
                }
            });
            return self.addDummySlides().then(function () {
                self.slidesNumber = 0;
                if (self.currentSlidesNumber == -1) {
                    console.log("try send first slide");
                    self.newSlide(self.slideDataList[++self.currentSlidesNumber])
                } else {
                    console.log("reconnect to classroom and instructor and get previous slides");
                }
            });
        } else {
            return new Promise(function (resolve, reject) {
                nextButton.remove();
                previousButton.remove();
                resolve();

            })

        }


    }
}