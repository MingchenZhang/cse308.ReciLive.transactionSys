function SoundControl(transactionSystem) {
    var self = this;
    self.moduleName = 'sound_control';
    self.asSpeaker = false;
    self.asListener = false;
    self.inited = false;

    /**
     * Init the control.
     * Called after all transaction has been received.
     */
    self.init = function(){
        if(self.asSpeaker || self.asListener) {
            self.inited = true;
            if(self.asSpeaker) document.dispatchEvent(events.switchToSpeaker());
            if(self.asListener) document.dispatchEvent(events.switchToListener());
        }else{ // if no transaction about sound control has been made
            if(transactionSystem.privilege.indexOf(self.moduleName) >=0 ){ // if this user is a "native" speaker
                transactionSystem.newTransaction(self.moduleName, {speakerChange: [[transactionSystem.userID, true]]}, {});
            }else{
                self.asListener = true;
            }
        }
    };

    this.update = function (index, description, createdBy, createdAt, payload) {
        var speakerChange = description.speakerChange;
        speakerChange.forEach(function (changeTuple) {
            if(changeTuple[0] == transactionSystem.userID){
                self.asSpeaker = changeTuple[1];
                self.asListener = !changeTuple[1];
                if(self.inited){
                    if(self.asSpeaker) document.dispatchEvent(events.switchToSpeaker());
                    if(self.asListener) document.dispatchEvent(events.switchToListener());
                }
            }
        });
    };

    /**
     * Assign new speaker. User will no longer send sound data after.
     * @param userID (string)
     * @returns {Promise}
     */
    this.giveSpeakerRoleTo = function (userID) {
        if(transactionSystem.privilege.indexOf(self.moduleName) == 0) return Promise.reject(new Error('not in control')); // if user has no control on sound control
        return transactionSystem.newTransaction(self.moduleName, {
            speakerChange: [[userID, true], [transactionSystem.userID, false]]
        }, {});
    };

    /**
     * take speaker role from a user.
     * @param userID (string) user to take
     * @returns {Promise.<*>}
     */
    this.takeSpeakerRole = function (userID) {
        if(transactionSystem.privilege.indexOf(self.moduleName) == 0) return Promise.reject(new Error('not in control')); // if user has no control on sound control
        return transactionSystem.newTransaction(self.moduleName, {
            speakerChange: [[userID, false], [transactionSystem.userID, true]]
        }, {});
    };

    this.reset = function () {

    };
}