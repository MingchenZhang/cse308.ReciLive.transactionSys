function Slide(transactionSystem, showDiv, previousButton, nextButton, selectBox) {

    var self = this;
    self.moduleName = 'slides';
    //slideList get all transaction in order
    self.isNotIncremental = true;
    self.slideList = [];
    //instructor img tag list
    self.slideData = {};
    self.ignoreTransaction = {};
    self.currentSlidesNumber = -1;
    //reset ignore slidelist and clean up canvas
    self.slidesName = null;
    self.reset = function () {
        self.ignoreTransaction = {};
        self.slideList = [];
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
        img.attr("src", "data:image/png;base64," + imgBase64);
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
        self.slideList.push(payload.slideImage);
        self.currentSlidesNumber = payload.slideIndex;
    };
    function enrollEvent() {
        document.addEventListener(event.switchToPlayBack.type, disableHandler);
        document.addEventListener(event.switchToLive.type, enableHandler);
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
            self.loadAllSlides = function (slidesIndex) {
                //TODO: delete IDToken
                resource.forEach(function (element) {
                    if (element.type == "slide") {
                        //get all slides list
                        self.slideList = element.content;
                    }
                });
                self.loadSlideFromURLList(element.contect);
            };
            self.loadSlideFromURLList = function (payload) {

                let promiseList = [];
                payload.forEach(function (slides) {
                    //counter for promiseList
                    let listItemCounter = -1;
                    self.slideList[slides.name] = [];
                    let index = -1;
                    slides.pages.forEach(function (url) {
                        index++;
                        listItemCounter++;
                        let i = index;
                        promiseList[listItemCounter] = new Promise(function (resolve, reject) {
                            var oReq = new XMLHttpRequest();
                            oReq.open("GET", url, true);
                            oReq.responseType = "arraybuffer";
                            oReq.onload = function (oEvent) {
                                var arrayBuffer = oReq.response; // Note: not oReq.responseText
                                if (arrayBuffer) {
                                    var bytes = new Uint8Array(arrayBuffer);
                                    var binary = '';
                                    for (var j = 0; j < bytes.byteLength; j++) {
                                        binary += String.fromCharCode(bytes[j]);
                                    }
                                    var base64 = window.btoa(binary);
                                    self.slideData[self.slidesName][i] = {slide64: base64, id: i};
                                    resolve();
                                }
                            };
                            oReq.send(null);
                        });
                    });
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
            self.loadAllSlides();

            if (self.currentSlidesNumber == -1) {
                console.log("try send first slide");
                self.newSlide(self.slideData[self.slidesName][++self.currentSlidesNumber])
            } else {
                console.log("reconnect to classroom and instructor and get previous slides");
            }
        } else {
            return new Promise(function (resolve, reject) {
                nextButton.remove();
                previousButton.remove();
                resolve();
            })
        }
    }

}