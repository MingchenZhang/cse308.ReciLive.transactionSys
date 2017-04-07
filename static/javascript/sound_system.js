SoundSystem = function(path, nativeSampleRate, eventRate){
    var self = this;
    var connection;

    var transmitionRate = 22000;
    var consumeRate = eventRate || 16384;
    var senderResampler = new Resampler(nativeSampleRate, transmitionRate, 1, Math.ceil(consumeRate*transmitionRate/nativeSampleRate)+1);
    var receiveResamplerSet = {};
    function getReceiveResampler(senderSampleRate){
        if(receiveResamplerSet[senderSampleRate]) return receiveResamplerSet[senderSampleRate];
        var appendByte = nativeSampleRate/senderSampleRate*consumeRate;
        receiveResamplerSet[senderSampleRate] = new Resampler(transmitionRate, nativeSampleRate, 1, Math.ceil(appendByte));
    }

    var receiverBuffer = new Queue();

    this.receiveFlag = false;
    var receiveHandle = function (e) {
        if(!self.receiveFlag) return false;
        var array = new Float32Array(e.data);
        var senderSampleRate = array[array.length-1];
        array = getReceiveResampler(senderSampleRate).resampler(array, array.length-1);
        if(receiverBuffer.getLength() > consumeRate*16){ // TODO; better delay drop algorithm
            console.log('receiverBuffer piling up, cleaning the queue...');
            receiverBuffer.empty();
        }
        for(var i = 0; i<array.length; i++){
            receiverBuffer.enqueue(array[i]);
        }
        console.log('sound received length: ' + array.length);
        console.log('tailing 2: ' + receiverBuffer.getLength());
    };

    this.connect = function () {
        connection = new wsConnection(path, ()=>{}, receiveHandle, false);
        connection.connect();
    };

    this.send = function(inputBuffer){
        var inputData = senderResampler.resampler(inputBuffer, consumeRate);
        var tobeSent = Float32Array.from({length: inputData.length+1}, (v,k)=>{
            if(k<inputData.length)return inputData[k];return nativeSampleRate; // append source sample rate
        });
        connection.send(tobeSent.buffer);
        console.log(tobeSent[0]);
    };

    this.writeNextSoundBuffer = function (bufferToWrite) {
        var bufferLength = receiverBuffer.getLength();
        if(bufferLength > consumeRate){
            for(var i=0; i<consumeRate; i++){
                bufferToWrite[i] = receiverBuffer.dequeue();
            }
            //console.log('tailing: '+(bufferLength-consumeRate));
            return true;
        }else{
            for(var i=0; i<consumeRate; i++){
                bufferToWrite[i] = 0;
            }
            console.log('waiting for sound data... ');
            return false;
        }
    };

    this.disconnect = function () {
        connection.close();
        connection = null;
        receiverBuffer.empty();
    };
};



function wsConnection(destination, onConnectCallback, receiveCallback, resend) {
    var self = this;
    var ws;
    var reconnectPending = false;

    this.connect = function () {
        // console.error('connect called');
        ws = createWebSocket(destination);
        ws.binaryType = "arraybuffer";
        ws.addEventListener("open", function (e) {
            onConnectCallback(e);
        });
        ws.addEventListener("message", function (e) {
            receiveCallback(e);
        });
        ws.addEventListener('close', function () {
            if(!reconnectPending){
                console.log('connection to %s closed, reconnect in 1 second', destination);
                setTimeout(()=>{self.connect(); reconnectPending = false;}, 1000);
                reconnectPending = true;
            }
        });
        ws.addEventListener('error', function () {
            if(!reconnectPending) {
                console.log('connection to %s failed, reconnect in 3 second', destination);
                ws.close();
                setTimeout(()=>{self.connect(); reconnectPending = false;}, 3000);
                reconnectPending = true;
            }
        });
    };

    function createWebSocket(path) {
        var protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
        return new WebSocket(protocolPrefix + '//' + location.host + path, 'transaction');
    }

    this.send = function (data) {
        if (ws.readyState != ws.OPEN && ws.readyState != ws.CONNECTING) {
            console.log('writing while websocket is not opened, reconnect in 0,5 second');
            if(!reconnectPending) {
                setTimeout(()=>{self.connect(); reconnectPending = false;}, 500);
                reconnectPending = true;
            }
            if (resend) {
                ws.addEventListener('open', function (e) {
                    // remove current event listener
                    e.target.removeEventListener(e.type, arguments.callee);
                    ws.send(data);
                });
            }
        } else {
            ws.send(data);
        }
    };

    this.reset = function () {
        ws.close();

    };
}