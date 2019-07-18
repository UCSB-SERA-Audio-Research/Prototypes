var sequence = [];
var tunedNotes = [];
var recording;

function customLog(text) {
    console.log(text);
}

window.onload = () => {
    document.querySelectorAll("#MIDI")[0].onchange = document.querySelectorAll("#AUDIO")[0].onchange = (file => {
        if (sequence.length > 0) {
            document.querySelectorAll("button")[0].disabled = false;
        } else {
            document.querySelectorAll("button")[0].disabled = true;
        }
    });
}

function getInputFrequency() {
    return readFile(document.getElementById('AUDIO').files[0]).then(data => {
        var fileByteArray = new Uint8Array(data);
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
        return audioContext.decodeAudioData(file.data).then(value => {
            const float32Array = value.getChannelData(0); // get a single channel of sound
            const pitch = detectPitch(float32Array); // null if pitch cannot be identified
            console.log("Pitch:", pitch);
            return pitch||440;
        });
    });
}

function run() {
    window.promptBackup = window.prompt; //back up the prompt function.
    window.prompt = () => { }; // disable the prompt function.
    // use ffmpeg to separate audio from video.
    offlineAudioContext = new (window.OfflineAudioContext)(2, 44100 * trackLength, 44100);
    audioContext = new AudioContext({ sampleRate: 44100 });
    document.querySelectorAll("button")[0].onclick = function () {
        location.reload();
    }
    document.querySelectorAll("button")[0].innerHTML = "Reload";
    getInputFrequency().then(inputFrequency => {

        var playing = [];
        var intervals = [];
        for (var i = 0; i < notes.length; i++) {
            playing.push([]);
            intervals.push([]);
        }
        sequence.forEach(note => {
            var noteID = note.note.number - 21;
            if (playing[noteID].length > 0) {
                playing[noteID].slice(0, -1);
                var lastEvent = playing[noteID][playing[noteID].length - 1];
                intervals[noteID].push({ time: lastEvent, length: note.time - lastEvent });
            }
            playing[noteID].push(note.time);
        });
        var lengthArray = [];
        intervals.forEach((note, i) => {
            if (note.length > 0) {
                lengthArray.push({ note: notes[i], lengths: note });
            }
        });
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
            promises.push(tuneToPitch(note.frequency, note.note,inputFrequency));
        }));
        notes.forEach(note => {
            tunedNotes.push(undefined);
        });
        return Promise.all(promises).then(values => {
            values.forEach(value => {
                tunedNotes[value.note] = (value.data);
            });
            processAudio().then(data => {
                data.forEach(item => {
                    tunedNotes[item.note] = item.audio;
                });
                console.log(tunedNotes);
                renderAudio();
            });
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

function tuneToPitch(frequency, note,inputFrequency) {

    return readFile(document.getElementById('AUDIO').files[0]).then(data => {
        var fileByteArray = new Uint8Array(data);
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
    });
}