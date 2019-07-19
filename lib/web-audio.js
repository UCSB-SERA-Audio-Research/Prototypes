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
    console.log(audioSequence);
    audioSequence.forEach(event=>{
        var source = offlineAudioContext.createBufferSource();
        source.buffer = event.buffer;
        source.connect(offlineAudioContext.destination);
        event.duration=Math.max(event.duration,0.1);
//        console.log(event.duration);
        source.start(event.time);
        source.stop(event.time+event.duration);
    });/*
    sequence.forEach((event,i) => {
        if (event.type == "on") {
            var source = offlineAudioContext.createBufferSource();
            source.buffer = tunedNotes[event.note.number - 21];
            console.log(tunedNotes[event.note.number - 21],audioSequence[i]);
            source.connect(offlineAudioContext.destination);
            source.start(event.time);
        }
    });*/
    offlineAudioContext.startRendering().then(function (renderedBuffer) {
        var blob = new Blob([new Uint8Array(audioBufferToWav(renderedBuffer))], { type: "wav" });
        console.log(blob);
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = "rendered.wav";
        link.click();
    });
}
