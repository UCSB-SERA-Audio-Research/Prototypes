var sequence = [];
var recording;

function customLog(text){
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

function run() {
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
    lengthArray.forEach(item => {
        var object={ratio:item.note.frequency / 440};
        toTune.push(object);
    });
    console.log(toTune);
    console.log("Started");
    var promises=[];
    (toTune.forEach(note=>{
        promises.push(tuneToPitch(note.ratio));
    }));
    return Promise.all(promises).then(values=>{
        console.log(values);
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

function tuneToPitch(ratio) {
    return readFile(document.getElementById('AUDIO').files[0]).then(data => {
        var fileByteArray; // The byte array of the input video.
        var filename = "audio.wav";
        fileByteArray = new Uint8Array(data); // convert the data to a Uint8Array.
        window.promptBackup = window.prompt; //back up the prompt function.
        window.prompt = () => { }; // disable the prompt function.
        // use ffmpeg to separate audio from video.
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
        var file = results[0]; // get the output audio file. 
        recording = new Uint8Array(file.data);
        return recording;
    });
}