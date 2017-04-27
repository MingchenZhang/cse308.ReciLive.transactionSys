console.assert(classroomNumber, 'classroomNumber needed to be provided');
console.assert(userID, 'userID needed to be provided');

eventRate = 2048;
microphone_stream = null;
soundSystem = new SoundSystem("/room/"+classroomNumber+"/sound", audioCtx.sampleRate, eventRate);
resource = null;

function createEventConstructor(type) {
    var func = function (option) {
        var event = new Event(type);
        return Object.assign(event, option);
    };
    func.type = type;
    return func;
}
events = {
    startRecitation: createEventConstructor('startRecitation'),
    disconnected: createEventConstructor('disconnected'),
    endRecitation: createEventConstructor('endRecitation'),
    switchToPlayBack: createEventConstructor('switchToPlayBack'),
    switchToLive: createEventConstructor('switchToLive'),
    workAreaRatioChange: createEventConstructor('workAreaRatioChange'),
    switchToSpeaker: createEventConstructor('switchToSpeaker'),
    switchToListener: createEventConstructor('switchToListener'),
};

$(document).ready(function () {
    $('.modal').modal();
});

transactionSystem = new TransactionSystem("/room/"+classroomNumber+"/transaction");
transactionSystem.roomNumber = classroomNumber;
transactionSystem.userID = userID;
soundControlSystem = new SoundControl(transactionSystem);
viewManager = new ViewManager($('.stage-view'));
chatModule = new Chat(transactionSystem, $('#info-board'), $('#submit'), $('#send'));
slideModule = new Slide(transactionSystem, viewManager.getDiv(), $('#previous-slide'), $('#next-slide'), $('#slides-selector'));
transactionSystem.registerModule(chatModule.moduleName, chatModule);
transactionSystem.registerModule(slideModule.moduleName, slideModule);
transactionSystem.registerModule(soundControlSystem.moduleName, soundControlSystem);
canvasController = new canvasontroller($('#CursorLayer'));
sliderController = new replayController(soundSystem, transactionSystem, $('.slider__range'),$('#slider-div'));
$('.ending-controller').click(transactionSystem.endRecitation);
document.addEventListener(events.endRecitation.type, (e) => {
    // if class has ended
    $(".rec-ended-notification").css("display", "block");
    // show the ended image
}, false);

var loadingDialog;
var prestartDialog;
loadingDialog = vex.dialog.open({
    message: 'page loading...',
    buttons: [],
    overlayClosesOnClick: false
});
//promiselist wait for the respose for vps(privilege and resource)
var promiseList = [$.ajax({
    url: window.location.href.split(/\?|#/)[0] + '/my_privilege',
    type: 'get',
    dataType: 'json',
}), $.ajax({
    url: '/room/'+classroomNumber+'/get_resource',
    type: 'get',
    dataType: 'json'
})];
Promise.all(promiseList).then(function (result) {
    //handle the privilege
    if (result[0].status == 'ok') {
        transactionSystem.privilege = result[0].privilege;
    } else throw result[0];
    //handle the resource
    resource = result[1].resources;
}).then(function () {
    //set handler for review mode
    sliderController.presetEvent();
    slideModule.presetEvent();
}).then(transactionSystem.init).then(function () {
    if (!transactionSystem.firstTransactionTime()) {
        // no transaction posted
        return new Promise(function (resolve, reject) {
            if (transactionSystem.privilege.indexOf('admin') >= 0) {
                // lecturer coming
                prestartDialog = vex.dialog.open({
                    message: 'the class has not started yet',
                    buttons: [{
                        text: 'start class', type: 'button', className: 'vex-dialog-button-primary',
                        click: function () {
                            transactionSystem.startRecitation();
                        }
                    }],
                    overlayClosesOnClick: false,
                });
            } else {
                // student coming
                prestartDialog = vex.dialog.open({
                    message: 'the class has not started yet',
                    buttons: [],
                    overlayClosesOnClick: false,
                });
            }
            document.addEventListener(events.startRecitation.type, function handler(e) {
                resolve(e);
                event.currentTarget.removeEventListener(event.type, handler);
            }, false);
        });
    }
}).then(function (event) {
    if (prestartDialog) vex.close(prestartDialog);
}).then(soundControlSystem.init).then(function (result) {
    slideModule.init();
    sliderController.init();
    viewManager.init();

    return activateSound();
}).then(() => {
    if (loadingDialog) vex.close(loadingDialog);
    console.log('ready');
}).catch(function (e) {
    console.error(e);
});

// initialize the audio processing
audioCtx = new AudioContext();
script_processor_node = audioCtx.createScriptProcessor(eventRate, 1, 1);
script_processor_node.onaudioprocess = function (audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;
    var inputData = inputBuffer.getChannelData(0);
    var outputData = outputBuffer.getChannelData(0);
    if (soundControlSystem.asSpeaker && transactionSystem.liveFlag)
        soundSystem.send(inputData);
    if (soundControlSystem.asListener)
        soundSystem.writeNextSoundBuffer(outputData);
};
microphone_stream = null;
microphone_stream_ctx = null;

/**
 * Activate or reconfig the audio process flow. This method should be called after soundControlSystem has been initialized
 * @returns {Promise} to config the audio flow. If the microphone is needed, use has to grant the microphone permission
 * to resolve the promise.
 */
function activateSound() {
    return new Promise(function (resolve, reject) {
        if (!soundControlSystem.asSpeaker) {
            return start_microphone();
        }
        if (microphone_stream) {
            return start_microphone(microphone_stream_ctx);
        }
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia || navigator.msGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({
                    audio: true
                },
                function (stream) {
                    if(microphone_stream !== stream) console.warn('microphone_stream !== stream');
                    if(!microphone_stream) microphone_stream = stream;
                    if(!microphone_stream_ctx) microphone_stream_ctx = audioCtx.createMediaStreamSource(microphone_stream);
                    start_microphone(microphone_stream_ctx);
                },
                function (e) {
                    alert('Error capturing audio.');
                    reject({reason: 'audio permission rejected'});
                }
            );
        } else {
            alert('getUserMedia not supported in this browser.');
            reject({reason: 'getUserMedia not supported in this browser.'});
        }

        function start_microphone(stream) {
            console.log('native sample rate: ' + audioCtx.sampleRate);
            if (soundControlSystem.asListener) soundSystem.receiveFlag = true;
            soundSystem.connect();
            if (stream) {
                stream.connect(script_processor_node);
            }
            stream.connect(audioCtx.destination);
            return resolve();
        }
    });
}

// attach handler to change speaker role
document.addEventListener(events.switchToSpeaker.type, activateSound, false);
document.addEventListener(events.switchToListener.type, activateSound, false);