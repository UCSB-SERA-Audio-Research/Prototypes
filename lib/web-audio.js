var offlineAudioContext;
var audioContext =  new AudioContext({ sampleRate: 44100 });

function processAudio() {
    var promises = [];
    tunedNotes.forEach((item, i) => {
        if (item != undefined) {
            promises.push(audioContext.decodeAudioData(item).then(value=>{
                return ({ audio: value, note: i });
            }));
        }
    });
    return Promise.all(promises);
}

function renderAudio() {
    console.log(audioSequence);
    audioSequence.forEach(event=>{
        var source = offlineAudioContext.createBufferSource();
        source.buffer = event.buffer;
        source.connect(offlineAudioContext.destination);
        source.start(event.time);
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
