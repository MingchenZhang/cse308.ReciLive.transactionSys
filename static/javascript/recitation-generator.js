RecitationGenerator = function () {
    var div;
    var init_info;
    var self = this;
    function getViewPromise() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: 'static/template/recitation.html',
                dataType: 'html'
            }).done(function (result) {
                var temps = $(result);
                TEMP_RECITATION_VIEW = null;
                if (!temps) {
                    return reject('didn\'t get script tag');
                }
                TEMP_RECITATION_VIEW = temps[0].text;
                resolve();
            }).fail(function (err) {
                console.error(err);
                return reject('FFFail from get recitation.html');
            });
        });
    }

    this.refresh = function (divToOperate, info, id) {
        div = divToOperate;
        init_info = info;

        if (typeof RECITATION_VIEW === 'undefined') {
            RECITATION_VIEW = getViewPromise();
        }
        RECITATION_VIEW.then(function () {
            var list_info = {
                recitation_name: info,
                id: id
            };
            var div1 = $('<div/>');
            var html = Mustache.to_html(TEMP_RECITATION_VIEW, list_info);
            div1.html(html);
            div1.appendTo(div);
        });
    };

    this.init = function (divToOperate, info, id) {
        return this.refresh(divToOperate, info, id);
    };
};
