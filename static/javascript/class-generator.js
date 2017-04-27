ClassGenerator = function () {
    var div;
    var init_info;
    var self = this;
    function getViewPromise() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: 'static/template/class.html',
                dataType: 'html'
            }).done(function (result) {
                var temps = $(result);
                TEMP_CLASS_VIEW = null;
                if (!temps) {
                    return reject('didn\'t get script tag');
                }
                TEMP_CLASS_VIEW = temps[0].text;
                resolve();
            }).fail(function (err) {
                console.error(err);
                return reject('FFFail from get class.html');
            });
        });
    }

    this.refresh = function (divToOperate, info) {
        div = divToOperate;
        init_info = info;

        if (typeof CLASS_VIEW === 'undefined') {
            CLASS_VIEW = getViewPromise();
        }
        CLASS_VIEW.then(function () {
            var list_info = {
                class_name: info,
            };
            var div1 = $('<div/>');
            var html = Mustache.to_html(TEMP_CLASS_VIEW, list_info);
            div1.html(html);
            div1.appendTo(div);
        });
    };

    this.init = function (divToOperate, info) {
        return this.refresh(divToOperate, info);
    };
};
