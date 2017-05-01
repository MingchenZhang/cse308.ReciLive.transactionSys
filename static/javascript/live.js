console.assert(classroomNumber, 'classroomNumber needed to be provided');
console.assert(userID, 'userID needed to be provided');


eventRate = 2048;
microphone_stream = null;
audioCtx = new AudioContext();
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
    slidesChange: createEventConstructor('slidesChange'),
    viewSizeChange: createEventConstructor('viewSizeChange'),
};

$(document).ready(function () {
    $('.modal').modal();
    $('#draw-color-picker').colorPicker({pickerDefault: "ffffff"});
    $('.student-list').hide();
});

function viewStudentList() {
  if($('.student-list').css('display') === 'none'){
    $('.student-list').show();
  }else {
    $('.student-list').hide();
  }
}

function viewInfoBoard() {
  if($('#info-board').css('display') === 'none'){
    $('#info-board').show();
  }else {
    $('#info-board').hide();
  }
}
function updateStudentList(students) {
  $(".student-list").empty();
  students.forEach(function(student) {
    if(student.role ==="speaker") {
      $(".student-list").append("<h4 onclick=selectUser("+ student.id +")>" + student.name + "<i class='fa fa-microphone student-microphone'></i></h4>");
    }else {
      $(".student-list").append("<h4 onclick=selectUser("+ student.id +")>" + student.name + "<i class='fa fa-headphones student-microphone'></i></h4>");
    }
  });
}
function newPost() {
  var post = $("#info-post").val();
  var color = '#'+ Math.round(0xffffff * Math.random()).toString(16);
  $newdiv = $('<div onclick="movePost()"><h4>'+ post +'</h4></div>').css({
      'background-color': color
  });
    var divxsize = ($newdiv.width()).toFixed();
    var divysize = ($newdiv.height()).toFixed();
  var posx = (Math.random() * ($(".col-md-4").width()-$newdiv.width()));
  // var posx = Math.floor(Math.random() * ($(".col-md-4").position().left+$(".col-md-4").width() - $(".col-md-4").position().left)) + $(".col-md-4").position().left;
  var posy = (Math.random() * ($(".col-md-4").height() - divysize));

  $newdiv.css({
      'position':'absolute',
      'left':posx+'px',
      'top':posy+'px',
      'display':'none'
  }).appendTo( '.col-md-4' ).fadeIn(100, function(){
     makePost("This is a comment!");
  });
  $("#info-post").val('');
}

function movePost() {

}

transactionSystem = new TransactionSystem("/room/"+classroomNumber+"/transaction");
transactionSystem.roomNumber = classroomNumber;
transactionSystem.userID = userID;
soundControlSystem = new SoundControl(transactionSystem);
viewManager = new ViewManager($('.stage-view'));
chatModule = new Chat(transactionSystem, $('#info-board'), $('#submit'), $('#send'));
slideModule = new Slide(transactionSystem, viewManager.getDiv(), $('#previous-slide'), $('#next-slide'), $('#slides-selector'));
drawModule = new Draw(transactionSystem,viewManager.getDiv(),$('#draw-control-panel'));
transactionSystem.registerModule(chatModule.moduleName, chatModule);
transactionSystem.registerModule(slideModule.moduleName, slideModule);
transactionSystem.registerModule(soundControlSystem.moduleName, soundControlSystem);
transactionSystem.registerModule(drawModule.moduleName,drawModule);
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
    drawModule.presetMethod();
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
    drawModule.init();
    return activateSound();
}).then(() => {
    if (loadingDialog) vex.close(loadingDialog);
    console.log('ready');
}).catch(function (e) {
    console.error(e);
});

// initialize the audio processing
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
            script_processor_node.connect(audioCtx.destination);
            return resolve();
        }
    });
}

// attach handler to change speaker role
document.addEventListener(events.switchToSpeaker.type, activateSound, false);
document.addEventListener(events.switchToListener.type, activateSound, false);
