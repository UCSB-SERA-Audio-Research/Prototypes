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
    var sources = [];
    sequence.forEach(event => {
        if (event.type == "on") {
            var source = offlineAudioContext.createBufferSource();
            source.buffer = tunedNotes[event.note.number - 21];
            source.connect(offlineAudioContext.destination);
            sources.push(source);
            source.start(event.time);
        }
    });
    offlineAudioContext.startRendering().then(function (renderedBuffer) {
        var blob = new Blob([new Uint8Array(audioBufferToWav(renderedBuffer))], { type: "wav" });
        console.log(blob);
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = "rendered.wav";
        link.click();
    });
}