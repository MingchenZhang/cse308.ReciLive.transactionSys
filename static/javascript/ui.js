//ui controller
function uiController(soundTransactionSystem, transactionSystem, slider) {
    var self = this;
    var playedTime = null;
    //playedTime = null in live mode
    var replayMode = false;
    var totalTime = null;
    var startTime = null;
    var sliderTime = null;
    var playedTimer = null;

    function getServerTime() {
        return $.ajax({
            url: 'http://localhost/current_time',//TODO: change this to gae server
            type: "POST",
            data: JSON.stringify({
                type: "time"
            }),
            contentType: "application/json",
        });

    }

    function timeTick() {
        //sey interval for the timer add total time and played time
        sliderTime = setInterval(function () {
            totalTime = new Date(totalTime.getTime() + 1000);
            updateTimeLine(slider, totalTime, playedTime, replayMode);
        }, 1000)
    }

    function playedTimerTick() {
        //sey interval for the timer add total time and played time
        playedTimer = setInterval(function () {
            playedTime = new Date(playedTime.getTime() + 1000);

            slider.val((playedTime - startTime) / (totalTime - startTime) * 100);
            updateTimeLine(slider, totalTime, playedTime, replayMode);
        }, 1000)
    }

    function startUpdateTotal() {
        //clean slider timer
        //if (sliderTime) clearInterval(sliderTime);
        //return a Promise
        return getServerTime().then(function (response) {
            //syc system time with total
            totalTime = new Date(response.time);
            console.log("total time syc with server time:" + totalTime);
        });
    }

    function attachListener(slider) {
        slider.change('change', function () {
            //user change time
            //slider.val will get int
            if (parseInt(slider.val() == 100)) {
                //jump to live
                replayMode = false;
                if (playedTimer) clearInterval(playedTime);
                playedTime = null;
            } else {
                getServerTime().then(function (response) {
                    var sysTime = new Date(response.time);
                    if (transactionSystem.firstTransactionTime())
                        startTime = new Date(transactionSystem.firstTransactionTime());
                    else {
                        console.log("no first transaction exsist");
                        slider.val(100);
                    }
                    playedTime = new Date(parseInt(slider.val()) * (sysTime.getTime() - startTime.getTime()) / 100 + startTime.getTime());
                    transactionSystem.switchTime(playedTime);
                    //soundTransactionSystem.jumpTo(playedTime);
                    playedTimerTick();
                });
            }
        });
    }

    function updateTimeLine(slider, totalTime, playedTime) {
        //TODO: update time node
    }

    self.init = function () {
        new Promise(function (resolve, reject) {
            //this promise set up the start time
            if (transactionSystem.firstTransactionTime()) {
                //if user join after first transaction
                getServerTime().then(function (response) {
                    startTime = new Date(transactionSystem.firstTransactionTime());
                    console.log("get start time from transaction system= " + startTime);
                    totalTime = new Date(response.time);
                    playedTime = null;
                    resolve();
                });
            } else {
                //no transaction when user get in
                slider.disable();
                reject();
            }
        }).then(function () {
            timeSysSycTimer = setInterval(function () {
                startUpdateTotal();
            }, 30000);
        }).then(function () {
            attachListener(slider)
        }).catch(function (e) {
            // handle for teacher's return
            console.log("student waiting for instructor return");
            console.error(e);

        });
    }
}
