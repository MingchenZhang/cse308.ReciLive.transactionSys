function Slide(transactionSystem, showDiv, previousButton, nextButton) {

    var self = this;
    self.moduleName = 'slides';
    //slideList get all transaction in order
    self.isNotIncremental = true;
    self.slideList = [];
    //instructor img tag list
    self.slideDataList = [];
    self.ignoreTransaction = {};
    self.currentSlidesNumber = -1;
    self.workCanvas = document.createElement('canvas');
    //when there are multiple slides use in one recitation
    self.slidesNumber = -1;
    //reset ignore slidelist and clean up canvas

    self.reset = function () {
        self.ignoreTransaction = {};
        self.slideList = [];
        self.slideDataList = [];
        //check here for reset problem
        if (showDiv.find('#slide-img')) showDiv.find('#slide-img').remove();
        currentSlidesNumber = -1;
    };
//clean canvas and show given img(URL or URI)
    function showImage(imgBase64, showDiv) {
        let img = $('<img id="slide-img">');
            //change the ratio and hight width
        img.attr("src", "data:image/png;base64,"+imgBase64);
        //console.log(imgBase64);
        showDiv.find('#slide-img').remove();
        showDiv.append(img);
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
//init call after transaction finish load and get privilege info
    self.init = function () {
        if (transactionSystem.privilege.indexOf("admin") != -1) var asController = 1;
        if (asController) {
            //as controller of slides
            self.loadAllSlides = function (slidesIndex) {
                //TODO: delete IDToken
                return $.ajax({
                    url: 'htttp://localhost:8080/get_resource',//TODO: change this to gae server
                    type: "POST",
                    data: JSON.stringify({
                        type: "slides",
                        index: slidesIndex,
                        payload: {classNumber: transactionSystem.roomNumber, slidesNumber: 0, StartAt: 0, EndAt: -1}
                    }),
                    contentType: "application/json",
                })
                    .then(
                        function (response) {
                            if (response.status == "error") {
                                //TODO: load error
                                return;
                            } else if (response.status == "ok") {
                                self.slidesNumber = slidesIndex;
                                return self.loadSlideFromURLList(response.payload);
                            }
                        }
                    ).catch(function (err) {
                        console.error(err);
                    });
            };
            self.loadSlideFromURLList = function (payload) {
                let index = -1;
                let promiseList = [];
                payload.URLList.forEach(function (url) {
                    index++;
                    let i = index;
                    promiseList[i] = new Promise(function (resolve, reject) {
                        var oReq = new XMLHttpRequest();
                        oReq.open("GET", url, true);
                        oReq.responseType = "arraybuffer";

                        oReq.onload = function (oEvent) {
                            var arrayBuffer = oReq.response; // Note: not oReq.responseText
                            if (arrayBuffer) {
                                var bytes = new Uint8Array(arrayBuffer);
                                var binary='';
                                for (var j = 0; j < bytes.byteLength; j++) {
                                    binary += String.fromCharCode(bytes[j]);
                                }
                                var base64 = window.btoa(binary);
                                self.slideDataList[i]={slide64:base64,id:i};
                                resolve();
                            }
                        };

                        oReq.send(null);

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
                        showImage(slideDataObj.slide64, showDiv);
                    }).catch(function (err) {
                    console.error('fail to new transaction');
                    console.error(err);
                    delete self.ignoreTransaction[id];
                });
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
            return self.loadAllSlides().then(function () {
                self.slidesNumber = 0;
                if (self.currentSlidesNumber == -1) {
                    console.log("try send first slide");
                    self.newSlide(self.slideDataList[++self.currentSlidesNumber])
                } else {
                    console.log("reconnect to classroom and instructor and get previous slides");
                }
            }).catch(function (err) {
                console.error(err);
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