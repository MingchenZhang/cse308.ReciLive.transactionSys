function Slide(transactionSystem, showDiv, sendButton, sendText) {
    var self = this;
    this.moduleName = 'slide';
    var slideList = [];
    var ignoreTransaction = {};

    this.newSlide = function (message) {
        var id = Math.random();
        ignoreTransaction[id] = true;
        transactionSystem.newTransaction(self.moduleName, {
            type: 'slide',
            id: id
        }, {message: message}).then(function (result) {
            chatList.push(message);
            showDiv.prepend($('<p/>').html(message));
        }).catch(function (err) {
            console.error('fail to new transaction');
            console.error(err);
            delete ignoreTransaction[id];
        });
    };
    this.update = function (index, description, createdBy, createdAt, payload) {
        if(ignoreTransaction[description.id]){
            delete ignoreTransaction[description.id];
            return;
        }
        chatList.push(payload.message);
        showDiv.prepend($('<p/>').html(payload.message));
    };
    this.reset = function () {
        ignoreTransaction = {};
        chatList = [];
        showDiv.empty();
    };

    sendButton.click(function () {
        console.log('sending:'+sendText.val());
        self.newMessage(sendText.val());
    });
}