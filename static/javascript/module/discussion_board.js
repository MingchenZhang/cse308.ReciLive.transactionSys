function DiscussionBoard(transactionSystem, newThreadFunc, , sendText) {
    var self = this;
    this.moduleName = 'discussion_board';
    var ignoreTransaction = {};
    var threads = {};

    this.newThread = function (message, options) {
        var threadID = guid();
        ignoreTransaction[threadID] = true;
        return transactionSystem.newTransaction(self.moduleName, {
            type: 'new_thread',
            id: threadID
        }, {type: 'new_thread', message: message}).then(function (result) {
            threads[threadID] = {};
            // TODO: code to create thread ui
        }).catch(function (err) {
            console.error('fail to create thread transaction');
            console.error(err);
            delete ignoreTransaction[threadID];
            throw err;
        });
    };

    this.newReply = function (message, replyTo, options) {
        console.assert(threads[replyTo]);
        var replyID = guid();
        ignoreTransaction[replyID] = true;
        return transactionSystem.newTransaction(self.moduleName, {
            type: 'new_thread_reply',
            id: replyID
        }, {type: 'new_thread_reply', replyTo: replyTo, message: message}).then(function (result) {
            // TODO: code to create reply ui
        }).catch(function (err) {
            console.error('fail to create thread reply transaction');
            console.error(err);
            delete ignoreTransaction[replyID];
            throw err;
        });
    };

    this.update = function (index, description, createdBy, createdAt, payload) {
        if(ignoreTransaction[description.id]) {
            delete ignoreTransaction[description.id];
            return;
        }
        if(payload.type == 'new_thread'){
            // TODO: code to create thread ui
        }else if(payload.type == 'new_thread_reply'){
            console.assert(threads[payload.replyTo]);
            // TODO: code to create reply ui
        }else{
            console.assert(false, 'unknown transaction');
            console.error(payload);
        }
    };
    this.reset = function () {
        ignoreTransaction = {};
        threads = {};
        // TODO: clear ui
    };

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
}