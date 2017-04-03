function Slide(transactionSystem,asController, showDiv, previousButton, nextButton) {
    var self = this;
    this.moduleName = 'slide';
    self.slide64;
    var slideList = [];
    var ignoreTransaction = {};
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
        return new promise(function (resolve, reject) {
            payload.URLList.forEach(function (url) {
                index++;
                var image = new Image();
                image.id = index;
                image.src = url;
                slideList.push();
            });
            resolve();
        });
    }

    this.addSessionDummy = function () {
        return loadSlideFromURLList(['localhost'])
    }
    previousButton.on('click', function () {

    });
    nextButton.on('click', function () {

    });
    this.newSlide = function (slideImage) {
        var id = Math.random();
        ignoreTransaction[id] = true;
        transactionSystem.newTransaction(self.moduleName, {
            type: 'slide',
            id: id
        }, {slideImage: self.slide64}).then(function (result) {
            slideList.push(slideImage);
            showImage(dataURItoBlob(self.slide64), showDiv);

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
        showImage(dataURItoBlob(payload.slideImage), showDiv);
    };
    this.reset = function () {
        ignoreTransaction = {};
        slideList = [];
        showDiv.empty();
    };

    sendButton.click(function () {
        console.log('image:' + this.id);
        self.newSlide(self.slide64);
    });

    function showImage(blob, showDiv) {
        var img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        showDiv.prepend(img);
    }

    function dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type: mimeString});
    }

    function getBase64(file) {
        var reader = new FileReader();
        reader.readAsDataURL(file[0]);
        reader.onload = function (e) {
            self.slide64 = reader.result;
            return;
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    }

}