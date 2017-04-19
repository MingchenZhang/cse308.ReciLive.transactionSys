function Slide(transactionSystem, showDiv, previousButton, nextButton, selectBox) {

    var self = this;
    self.moduleName = 'slides';
    //slideList get all transaction in order
    self.isNotIncremental = true;
    //instructor img tag list
    self.slideData = {};
    self.ignoreTransaction = {};
    self.currentSlidesNumber = -1;
    //reset ignore slidelist and clean up canvas
    self.slidesName = null;
    self.reset = function () {
        self.ignoreTransaction = {};
        self.slideData = {};
        self.slidesName = null;
        //check here for reset problem
        if (showDiv.find('#slide-img')) showDiv.find('#slide-img').remove();
        currentSlidesNumber = -1;
    };
    function getRatio(img) {
        //check if document ready
        return img[0].naturalHeight / img[0].naturalWidth;
    }

//clean canvas and show given img(URL or URI)
    function showImage(imgBase64, showDiv) {
        let img = $('<img id="slide-img">');
        //change the ratio and hight width
        img.attr("src", imgBase64);
        //console.log(imgBase64);
        showDiv.find('#slide-img').remove();
        img.css('width', '100%');
        //color border
        img.css('border', '3px solid red');
        viewManager.changeRatio(getRatio(img));
        showDiv.append(img);
    }

    function getSlidesName() {

    }

    //update all the slides to front end transaction system
    self.update = function (index, description, createdBy, createdAt, payload) {
        if (self.ignoreTransaction[description.id]) {
            delete self.ignoreTransaction[description.id];
            return;
        }
        //add img to slideList by time
        showImage(payload.slideImage, showDiv);
        self.currentSlidesNumber = payload.slideIndex;
    };
    function enrollEvent() {
        document.addEventListener(events.switchToPlayBack.type, disableHandler);
        document.addEventListener(events.switchToLive.type, enableHandler);
    }

    function disableHandler() {
        previousButton.hide();
        nextButton.hide();
    }

    function enableHandler() {
        previousButton.hide();
        nextButton.hide();
    }

//init call after transaction finish load and get privilege info
    self.init = function () {
        enrollEvent();
        if (transactionSystem.privilege.indexOf("admin") != -1) var asController = 1;
        if (asController) {
            //as controller of slides
            self.loadAllSlides = function () {
                //TODO: delete IDToken
                var promiseList=[];
                resource.forEach(function (element) {
                    if (element.type == "slide") {
                        //get all slides list
                        let payload = element.content;
                        let promiseList = [];
                        payload.forEach(function (slides) {
                            //counter for promiseList
                            let listItemCounter = -1;
                            let index = -1;
                            self.slideData[slides.name]=[];
                            slides.pages.forEach(function (url) {
                                index++;
                                listItemCounter++;
                                let i = index;
                                promiseList[listItemCounter] = new Promise(function (resolve, reject) {
                                    var img = new Image();
                                    img.crossOrigin='Anonymous';
                                    img.onload = function () {
                                        let canvas = document.createElement("canvas");
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        canvas.getContext('2d').drawImage(img, 0, 0);

                                        self.slideData[slides.name][i] = {
                                            slide64: canvas.toDataURL("image/png"),
                                            id: i
                                        };
                                    };
                                    img.src = url.url;
                                });
                            });
                        });
                    }
                });
                return promiseList;
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
                    slidesName: self.slidesName
                })
                    .then(function (result) {
                        showImage(slideDataObj.slide64, showDiv);
                    }).catch(function (err) {
                    console.error('fail to new transaction');
                    console.error(err);
                    delete self.ignoreTransaction[id];
                });
            };

            previousButton.on('click', function () {
                if (self.currentSlidesNumber - 1 > -1) {
                    self.newSlide(self.slideData[self.slidesName][--self.currentSlidesNumber]);
                    console.log("previous slide\n current slide number :", self.currentSlidesNumber);
                }
                else {
                    console.log("no previous slide\n");
                }
            });
            nextButton.on('click', function () {
                if (self.currentSlidesNumber + 1 < self.slideData.length) {
                    self.newSlide(self.slideData[self.slidesName][++self.currentSlidesNumber]);
                    console.log("next slide\n current slide number :", self.currentSlidesNumber);
                }
                else {
                    console.log("no next slide\n");
                }
            });
            Promise.all(self.loadAllSlides()).then(function (responce) {
                if (self.currentSlidesNumber == -1) {
                    console.log("try send first slide");
                    self.newSlide(self.slideData['first slide'][++self.currentSlidesNumber]);
                    resolve();
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