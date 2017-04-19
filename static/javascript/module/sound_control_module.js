function SoundControl(transactionSystem) {
    var self = this;
    self.moduleName = 'sound_control';
    self.asSpeaker = false;
    self.asListener = false;

    self.init = function(){
        if(self.asSpeaker || self.asListener) return;
        if(transactionSystem.privilege.indexOf(self.moduleName) >=0 ){
            transactionSystem.newTransaction(self.moduleName, {speakerChange: [[transactionSystem.userID, true]]}, {});
        }else{
            self.asListener = true;
        }
    };

    this.update = function (index, description, createdBy, createdAt, payload) {
        var speakerChange = description.speakerChange;
        speakerChange.forEach(function (changeTuple) {
            if(changeTuple[0] == transactionSystem.userID){
                self.asSpeaker = changeTuple[1];
                self.asListener = !changeTuple[1];
                if(self.asSpeaker) document.dispatchEvent(events.switchToSpeaker());
            }
        });
    };
    this.reset = function () {

    };
}