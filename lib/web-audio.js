//https://github.com/Theodeus/tuna/wiki/Getting-started
//https://github.com/Theodeus/tuna/wiki/Node-examples
var offlineAudioContext;
var audioContext =  new AudioContext({ sampleRate: 44100 });

function processAudio() {
    var promises = [];
    Object.keys(tunedNotes).forEach((key) => {
        promises.push(audioContext.decodeAudioData(tunedNotes[key]).then(value=>{
            return ({ audio: value, note: key });
        }));
    });
    return Promise.all(promises);
}

function renderAudio() {
    if(live){
        audioContext =  new AudioContext({ sampleRate: 44100 });
        offlineAudioContext=audioContext;
    }
    console.log(audioSequence);
    audioSequence.forEach(event=>{
        var playAudio=()=>{
            var tuna = new Tuna(offlineAudioContext);
            var effect;
            if(document.querySelectorAll("#effect")[0].value=="delay"){
                effect = new tuna.Delay({
                    feedback: parseFloat(document.querySelectorAll(".feedback")[0].value),    //0 to 1+
                    delayTime: parseFloat(document.querySelectorAll(".delayTime")[0].value),//150,    //1 to 10000 milliseconds
                    wetLevel: parseFloat(document.querySelectorAll(".wetLevel")[0].value),    //0 to 1+
                    dryLevel: parseFloat(document.querySelectorAll(".dryLevel")[0].value),       //0 to 1+
                    cutoff: 2000,      //cutoff frequency of the built in lowpass-filter. 20 to 22050
                    bypass: 0
                });
            }else{
                effect =  new tuna.Convolver({
                    highCut: 22050,                         //20 to 22050
                    lowCut: 20,                             //20 to 22050
                    dryLevel: 0,                            //0 to 1+
                    wetLevel: 1,                            //0 to 1+
                    level: 1,                               //0 to 1+, adjusts total output of both wet and dry
                    impulse: "tests/IR.wav",    //the path to your impulse response
                    bypass: 0
                });
            }
            var source = offlineAudioContext.createBufferSource();
            source.buffer = event.buffer;
            source.connect(effect);
            effect.connect(offlineAudioContext.destination);
            event.duration=Math.max(event.duration,0.1);
            event.duration=Math.min(event.duration,1);
//        console.log(event.duration);
            source.start(event.time);
            if(document.querySelectorAll(".length")[0].checked){
                source.stop(event.time+event.duration);
            }
        };
        if(live){
            setTimeout(playAudio,event.time*1000);
        }else{
            playAudio();
        }
    });
    //https://github.com/mattdiamond/Recorderjs
    /*
    sequence.forEach((event,i) => {
        if (event.type == "on") {
            var source = offlineAudioContext.createBufferSource();
            source.buffer = tunedNotes[event.note.number - 21];
            console.log(tunedNotes[event.note.number - 21],audioSequence[i]);
            source.connect(offlineAudioContext.destination);
            source.start(event.time);
        }
    });
    audioContext*/
    if(!live){
        offlineAudioContext.startRendering().then(function (renderedBuffer) {
            var blob = new Blob([new Uint8Array(audioBufferToWav(renderedBuffer))], { type: "wav" });
            console.log(blob);
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = "rendered.wav";
            link.click();
        });
    }
    /**/
}
