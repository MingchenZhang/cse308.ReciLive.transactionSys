//ui controller
var replayController = function (soundTransactionSystem, transactionSystem, slider) {
    self = this;
    var totalTime = null;
    var startTime = null;
    var playedTime = null;
    var systemTimeUpdateCounter = null;
    var liveMode = null;
    //teacher may not in the room
    var updateInternvarSecond = 1000;
    var classEnd = null;
    function totalTimeInitAndServerTimeUpdater() {
        return $.ajax({
            url: 'http://localhost/current_time',
            type: "POST",
            data: JSON.stringify({
                type: "time"
            }),
            contentType: "application/json",
        }).then(function (response) {
            totalTime = new Date(response.time);
            if (liveMode) playedTime = totalTime;
            if (!startTime) console.error("you should get a start time befoer total time init");
        });
    }

    function sliderUpdater() {
        if (!startTime && !transactionSystem.firstTransactionTime()) {
            setTimeout(sliderUpdater, 1000);
            return;
        }
        else if (!startTime && transactionSystem.firstTransactionTime()) {
            liveMode = true;
            startTime = transactionSystem.firstTransactionTime();
            totalTimeInitAndServerTimeUpdater().then(function () {
                slider.prop('disabled', false);
                attachListener(slider);
                sliderUpdater();
            });
        }
        else {
            if (systemTimeUpdateCounter >= 30) {
                totalTimeInitAndServerTimeUpdater();
                systemTimeUpdateCounter = 0;
            }
            //run  every 0.1 second
            playedTime = new Date(playedTime.getTime() + updateInternvarSecond);
            totalTime = new Date(totalTime.getTime() + updateInternvarSecond);
            slider.val((playedTime.getTime() - startTime.getTime()) / (totalTime.getTime() - startTime.getTime()) * 100);
            //console.log("current percentage:", slider.val());
            //console.log("total:", totalTime);
            //console.log("played:", playedTime);
            systemTimeUpdateCounter++;
            //TODO:check if class over
            setTimeout(sliderUpdater, updateInternvarSecond);
        }
    }

    function enrollEvent() {
        document.addEventListener(events.endRecitation.type, classEnd);
    }

    function classEnd() {
//TODO: need maek sure last transaction be set up before this function called
        classEnd=true;
     //no one should change total time after this
        totalTime = transactionSystem.transaction[transactionSystem.transaction]
    }

    self.init = function () {
        enrollEvent()
        if (transactionSystem.privilege.indexOf("admin") != -1) {
            //instructor live
            slider.remove();
        }
        //get start time
        else if (transactionSystem.firstTransactionTime()) {
            setTimeout(sliderUpdater, updateInternvarSecond);
        } else {
            //no first transaction teacher haven't get in to room
            slider.prop('disabled', true);
            setTimeout(sliderUpdater, updateInternvarSecond);
        }
    };
    function attachListener(slider) {
        slider.change('change', function () {
            //user change time
            //slider.val will get int
            if (parseInt(slider.val() == 100)) {
                //jump to live
                liveMode = true;
                playedTime = totalTime;
            } else {
                liveMode = false;
                playedTime = new Date(slider.val() * (totalTime.getTime() - startTime.getTime()) / 100 + startTime.getTime());
                transactionSystem.switchTime(playedTime);
                soundTransactionSystem.jumpTo(playedTime);
            }
        });
    }
};