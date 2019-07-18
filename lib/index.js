var sequence = [];
var tunedNotes = [];
var audioSequence = [];
var recording = null;

function customLog(text) {
    console.log(text);
}

function copy(src) {
    var dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
}

window.onload = () => {
    document.querySelectorAll("#AUDIO")[0].onchange = function () {
        readFile(document.querySelectorAll("#AUDIO")[0].files[0]).then(localBuffer => {
            audioArray = copy(localBuffer);
            audioContext.decodeAudioData(localBuffer).then(rec => {
                recording = rec;
            });
        });
    }
}

function getInputFrequency() {
    console.log(audioArray);
    var fileByteArray = new Uint8Array(audioArray);
    var filename = "audio.wav";
    var results = ffmpeg_run({
        // -i <input> -af asetrate=44100*0.5,aresample=44100||,atempo=1/2 <output>
        arguments: ("-i " + filename + " -ss 0 -t 0.05 -ac 1 out.wav").split(" "),
        files: [
            {
                data: fileByteArray,
                name: filename
            }
        ]
    });
    var file = results[0];
    const float32Array = recording.getChannelData(0); // get a single channel of sound
    const pitch = detectPitch(float32Array); // null if pitch cannot be identified
    console.log("Pitch:", pitch);
    return pitch || 440;
}

function run() {
    tunedNotes=[];
    audioSequence=[];
    offlineAudioContext = new (window.OfflineAudioContext)(2, 44100 * trackLength, 44100);
    if (sequence.length == 0 || recording == null) {
        return;
    }
    audioSequence = Array(sequence.length);
    audioSequence.forEach((clip, i) => {
        audioSequence[i] = undefined;
    });
    window.promptBackup = window.prompt; //back up the prompt function.
    window.prompt = () => { }; // disable the prompt function.
    // use ffmpeg to separate audio from video.
    var inputFrequency = getInputFrequency();

    var playing = [];
    var intervals = [];
    for (var i = 0; i < notes.length; i++) {
        playing.push([]);
        intervals.push([]);
    }
    sequence.forEach((note, i) => {
        var noteID = note.note.number - 21;
        if (playing[noteID].length > 0) {
            playing[noteID].slice(0, -1);
            var lastEvent = playing[noteID][playing[noteID].length - 1];
            intervals[noteID].push({ time: lastEvent.time, length: note.time - lastEvent.time, order: lastEvent.order });
        }
        playing[noteID].push({ time: note.time, order: i });
    });
    var lengthArray = [];
    intervals.forEach((note, i) => {
        if (note.length > 0) {
            lengthArray.push({ note: notes[i], lengths: note });
        }
    });
    console.log(lengthArray);
    var toTune = [];
    intervals.forEach((item, i) => {
        if (item.length > 0) {
            var object = { frequency: notes[i].frequency, note: i };
            toTune.push(object);
        }
    });
    //    console.log(toTune);
    console.log("Started");
    var promises = [];
    (toTune.forEach(note => {
        promises.push(tuneToPitch(note.frequency, note.note, inputFrequency));
    }));
    notes.forEach(note => {
        tunedNotes.push(undefined);
    });
    return Promise.all(promises).then(values => {
        values.forEach(value => {
            console.log("NOTE: ",value.note);
            tunedNotes[value.note] = (value.data);
        });
        processAudio().then(data => {
            data.forEach(item => {
                tunedNotes[item.note] = item.audio;
            });
            /*
            lengthArray.forEach(tune => {
                tune.lengths.forEach(lengthInfo => {
                    console.log(lengthInfo,tune.note.number-21);
                    var ratio = tune.note.frequency / inputFrequency;
                    var atempo= lengthInfo.length/(ratio*recording);
                    console.log(ratio,atempo);
                    var results = ffmpeg_run({
                        //!!!
                        // -i <input> -af asetrate=44100*0.5,aresample=44100||,atempo=1/2 <output>
                        arguments: ("-i " + filename + " -filter:a "+atempo+" out.wav").split(" "),
                        files: [
                            {
                                data: new Uint8Array(audioArray),
                                name: "audio.wav"
                            }
                        ]
                    });
                    var file = results[0];
                    console.log(file);
                });
            });*/
            renderAudio();
        });
    });
}

const readFile = (inputFile) => {
    const temporaryFileReader = new FileReader();

    return new Promise((resolve, reject) => {
        temporaryFileReader.onerror = () => {
            temporaryFileReader.abort();
            reject(new DOMException("Problem parsing input file."));
        };

        temporaryFileReader.onload = () => {
            resolve(temporaryFileReader.result);
        };
        temporaryFileReader.readAsArrayBuffer(inputFile);
    });
};

function tuneToPitch(frequency, note, inputFrequency) {
    var fileByteArray = new Uint8Array(audioArray);
    var filename = "audio.wav";
    var ratio = frequency / inputFrequency;
    var results = ffmpeg_run({
        // -i <input> -af asetrate=44100*0.5,aresample=44100||,atempo=1/2 <output>
        arguments: ("-i " + filename + " -af asetrate=44100*" + ratio.toString() + ",aresample=44100 out.wav").split(" "),
        files: [
            {
                data: fileByteArray,
                name: filename
            }
        ]
    });
    var file = results[0];
    return { data: file.data, note: note };
}