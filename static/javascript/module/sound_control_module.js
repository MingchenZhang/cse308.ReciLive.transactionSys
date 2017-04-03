function SoundControl(transactionSystem) {
    var self = this;
    self.moduleName = 'sound_control';
    self.asSpeaker = false;
    self.asListener = false;

    self.init = function(){
        if(transactionSystem.privilege.indexOf(transactionSystem.userID)){
            transactionSystem.newTransaction(self.moduleName, {speakerChange: [[transactionSystem.userID, true]]}, {});
        }
    };

    this.update = function (index, description, createdBy, createdAt, payload) {
        var speakerChange = description.speakerChange;
        speakerChange.forEach(function (changeTuple) {
            if(changeTuple[0] == transactionSystem.userID){
                self.asSpeaker = changeTuple[1];
                self.asListener = !changeTuple[1];
            }
        });
    };
    this.reset = function () {

    };
}