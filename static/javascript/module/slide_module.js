function Slide(transactionSystem, showDiv, previousButton, nextButton, selectorDiv) {

    var self = this;
    self.moduleName = 'slides';
    //slideList get all transaction in order
    self.isNotIncremental = true;
    //instructor img tag list
    self.slideData = [];
    self.ignoreTransaction = {};
    self.currentSlidesNumber = -1;
    //reset ignore slidelist and clean up canvas
    self.slidesName = null;
    self.preload = 5; // how many slides will be preload
    self.reset = function () {
        self.ignoreTransaction = {};
        self.slideData = [];
        self.slidesName = null;
        //check here for reset problem
        if (showDiv.find('#slide-img')) showDiv.find('#slide-img').remove();
        self.currentSlidesNumber = -1;
    };
    /**
     * utili calculate the ratio of the img and send to view manager
     * @param img
     * @returns {number}
     */
    function getRatio(img) {
        //check if document ready
        return img[0].naturalHeight / img[0].naturalWidth;
    }

    /**
     * update other slides to UI
     */
    function updateSelector() {
        selectorDiv.children('*').remove();
        let i = 0;
        self.slideData.forEach(function (element) {
            var slidesOption = $('<div class="slides element" value="' + element.name + '">' + element.name + '</div>');
            slidesOption.on('click', function () {
                self.slidesName = $(this).attr('value');
                self.currentSlidesNumber = 0;
                self.newSlide(self.slideData[slidesName].imgDataList[0]);
            });
            selectorDiv.append(slidesOption);
        });
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
        img[0].onload = function () {
            viewManager.changeRatio(getRatio(img));
        };
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
        self.currentSlidesNumber = payload.slideIndex;
        self.slidesName = payload.slidesName;
    };
    function enrollEvent() {            //enroll　enable handler and disable handler
        document.addEventListener(events.switchToPlayBack.type, disableHandler);
        document.addEventListener(events.switchToLive.type, enableHandler);
    }

    function disableHandler() {
        previousButton.hide();
        nextButton.hide();
    }

    self.presetEvent = function () {        //preset end recitation event enter review mode
        document.addEventListener(events.endRecitation.type, function () {
            //review mode
            disableHandler();
        })
    };

    function enableHandler() {
        previousButton.hide();
        nextButton.hide();
    }

    function resourceChecker(resource) {
        if (!resource)return true;
        for (element in resource) {
            if (resource[element].type == "slide")return false;
        }
        return true;
    }

    function getImage(slidesName, slidesNumber) {
        var obj = self.slideData[slidesName].imgDataList[slidesNumber];
        if (obj.then) {
            return obj;
        } else if (slidesNumber >= 0 && slidesNumber < self.slideData[slidesName].imgDataList.length) {
            return self.slideData[slidesName].imgDataList[slidesNumber] = new Promise(function (resolve, reject) {
                var img = document.createElement('img');
                img.crossOrigin = 'anonymous';
                img.src = obj.url;
                img.onload = function () {
                    let canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    resolve({slide64: canvas.toDataURL("image/png"), id: slidesNumber});
                };
            })
        } else {
            console.log("out of index for slidenumber");
        }
    }

    function getImagePromiseList(slidesName, slidesStart, slidesEnd) {
        if (slidesStart <= slidesEnd) {
            var PromiseList = [];
            for (var index = slidesStart; index <= slidesEnd; index++) {
                PromiseList.push(getImage(slidesName, index));
            }
            return PromiseList;
        }
    }

//init call after transaction finish load and get privilege info
    self.init = function () {
        if (resourceChecker(resource)) {
            nextButton.hide();
            previousButton.hide();
            selectorDiv.hide();
            $('.fa.fa-window-restore.fa-2x.slides').hide();
            return [];
        }
        enrollEvent();
        if (transactionSystem.privilege.indexOf("admin") != -1) var asController = 1;       // admin get control
        if (asController) {
            self.loadAllSlides = function () {              //download all slides url
                var promiseList = [];
                resource.forEach(function (element) {
                    if (element.type == "slide") {
                        //get all slides list
                        let payload = element.content;
                        let slidesCounter = 0;
                        let listItemCounter = -1;
                        payload.forEach(function (slides) {
                            //counter for promiseList
                            if (!self.slidesName || self.slidesName == null) self.slidesName = slides.name;
                            self.slideData[slides.name] = {name: slides.name, imgDataList: slides.pages};
                            promiseList.concat(getImagePromiseList(slides.name, 0, self.preload));
                        });
                    }
                });
                return promiseList;
            };
            /**
             * send new slides to transaction system
             * @param slideDataObj
             */
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
                    slidesName: self.slidesName,
                })
                    .then(function (result) {
                        document.dispatchEvent(events.slidesChange());    //dispatch event for the slides changing
                        showImage(slideDataObj.slide64, showDiv);
                    }).catch(function (err) {
                    console.error('fail to new transaction');
                    console.error(err);
                    delete self.ignoreTransaction[id];
                });
            };
            addHandler();

            Promise.all(self.loadAllSlides()).then(function (response) {
                updateSelector();
                if (self.currentSlidesNumber == -1) {
                    console.log("try send first slide");
                    self.slidesIndex = 0;
                    self.slidesName = self.slideData[self.slidesName].name;
                    getImage(self.slidesName, ++self.currentSlidesNumber).then(function (response) {
                        self.newSlide(response);
                    });
                } else {
                    console.log("reconnect to classroom and instructor and get previous slides");
                }
            });
        } else {
            return new Promise(function (resolve, reject) {     //don't have control for slides
                nextButton.remove();
                previousButton.remove();
                resolve();
            })
        }
    };
    function addHandler() {
        previousButton.on('click', function () { //to precious slide
            if (self.currentSlidesNumber - 1 > -1) {
                getImage(self.slidesName, --self.currentSlidesNumber).then(function (response) {
                    self.newSlide(response);
                });
                getImagePromiseList(self.slidesName, self.currentSlidesNumber--, self.currentSlidesNumber++);
                console.log("previous slide\n current slide number :", self.currentSlidesNumber);
            }
            else {
                console.log("no previous slide\n");
                toastr.success('no previous slide', '', {timeOut: 10000, progressBar: true});

            }
        });

        nextButton.on('click', function () {        //to next slide
            if (self.currentSlidesNumber + 1 < self.slideData[self.slidesName].imgDataList.length) {
                getImage(self.slidesName, ++self.currentSlidesNumber).then(function (response) {
                    self.newSlide(response);
                });
                getImagePromiseList(self.slidesName, self.currentSlidesNumber--, self.currentSlidesNumber++);
                console.log("next slide\n current slide number :", self.currentSlidesNumber);
            }
            else {
                console.log("no next slide\n");
                toastr.success('no next slide', '', {timeOut: 10000, progressBar: true});
            }
        });
    }
}