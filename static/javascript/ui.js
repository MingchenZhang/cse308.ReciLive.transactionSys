//ui controller
var UIController = function (soundTransactionSystem, transactionSystem, slider) {
    self = this;

    var totalTime = null;
    var startTime = null;
    var playedTime = null;
    var timer = null;
    var systemTimeUpdateCounter = null;
    var liveMode = null;
    //teacher may not in the room


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
        if (!startTime && !transactionSystem.firstTransactionTime())return;
        else if (!startTime && transactionSystem.firstTransactionTime()) {
            liveMode = true;
            startTime = transactionSystem.firstTransactionTime();
            totalTimeInitAndServerTimeUpdater().then(function () {
                slider.prop('disabled',false);
                attachListener(slider);
                setTimeout(sliderUpdater, 0);
            });
        }
        else {
            if (systemTimeUpdateCounter >= 300) {
                totalTimeInitAndServerTimeUpdater();
                systemTimeUpdateCounter = 0;
            }
            //run  every 0.1 second
            playedTime = new Date(playedTime.getTime() + 100);
            totalTime = new Date(totalTime.getTime() + 100);
            slider.val((playedTime - startTime) / (totalTime - startTime) * 100);
            systemTimeUpdateCounter++;
            //TODO:check if class over
            setTimeout(sliderUpdater, 1000);
        }
    }

    self.init = function () {
        //get start time
        if (transactionSystem.firstTransactionTime()) {
            setTimeout(sliderUpdater, 1000);
        } else {
            //no first transaction teacher haven't get in to room
            slider.prop('disabled',true);
            setTimeout(sliderUpdater, 1000);
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


}