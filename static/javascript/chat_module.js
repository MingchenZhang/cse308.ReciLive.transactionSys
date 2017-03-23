function Chat(transactionSystem, showDiv) {
    var moduleName = 'chat';
    var chatList = [];
    var ignoreTransaction = {};

    this.newMessage = function (message) {
        var id = Math.random();
        ignoreTransaction[id] = true;
        transactionSystem.newTransaction(moduleName, {
            type: 'message',
            id: id
        }, {message: message}).catch(function (err) {
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
        showDiv.append($('<p/>').html(payload.message));
    };
    this.reset = function () {
        ignoreTransaction = {};
        chatList = [];
        showDiv.empty();
    };
}