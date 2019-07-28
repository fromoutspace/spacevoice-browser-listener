class SpeechRecognitionManager {

    constructor() {
        this.speechRecognition = new ManagedSpeechRecognitionConfigurer(this).getSpeechRecognitionInstance();
        this.lastStartTime = -1;
        this.restartCallCounter = 0;
        this.isStoped = false;
        this.onResultCallback = results => console.log(results);
    }

    start() {
        this.lastStartTime = new Date().getTime();
        this.isStoped = false;
        this.restartCallCounter = 0;
        this.speechRecognition.start();
    }

    stop() {
        this.speechRecognition.stop();
        this.isStoped = true;
    }

    restart() {
        if (this.isStoped || this.restartCallCounter > 0) return;

        this.restartCallCounter++;

        const currentTime = new Date().getTime();
        const timeSinceLastStart = currentTime - this.lastStartTime;

        if (timeSinceLastStart < 1000)
            setTimeout(() => this.start(), 1000 - timeSinceLastStart);
        else
            this.start()
    }

    handleResults(results) {
        this.onResultCallback(results);
    }

    setOnResultCallback(callback) {
        this.onResultCallback = callback;
    }
}


class ManagedSpeechRecognitionConfigurer {

    constructor(speechRecognitionManager, speechRecognitionProperties = {}) {
        this.speechRecognitionManager = speechRecognitionManager;
        this.speechRecognition = new webkitSpeechRecognition();
        this.fillProperties(speechRecognitionProperties);
        this.fillCustomProperties();
        this.fillEvents();
    }

    getSpeechRecognitionInstance() {
        return this.speechRecognition;
    }

    fillProperties(speechRecognitionProperties) {
        const speechRecognitionDefaultProperties = {
            continuous: false,
            maxAlternatives: 3,
            lang: "ru"
        };
        Object.assign(this.speechRecognition, speechRecognitionDefaultProperties);
        Object.assign(this.speechRecognition, speechRecognitionProperties);
    }

    fillCustomProperties() {
        this.speechRecognition._isListening = false;
        this.speechRecognition._autoRestart = true;
    }

    fillEvents() {
        this.speechRecognition.onstart = () => {
            this.speechRecognition._isListening = true;
        };
        this.speechRecognition.onerror = event => {
            switch (event.error) {
                case 'network':
                    console.error("Network error");
                    break;
                case 'not-allowed':
                case 'service-not-allowed':
                    // if permission to use the mic is denied, turn off auto-restart
                    console.error("Can't access microphone");
                    this.speechRecognition._autoRestart = false;
            }
        };
        this.speechRecognition.onresult = event => {
            const textResults = [...event.results[event.resultIndex]].map(result => result.transcript);
            this.speechRecognitionManager.handleResults(textResults);
        };
        this.speechRecognition.onend = () => {
            this.speechRecognition._isListening = false;

            if (this.speechRecognition._autoRestart)
                this.speechRecognitionManager.restart();
        };
    }
}

class SpeechManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voiceLang = 'ru-RU'
    }

    say(text) {
        const utter = this.getUtter(text);
        this.synthesis.speak(utter);
    }

    getUtter(text) {
        if (!this.utter) {
            this.utter = new SpeechSynthesisUtterance(text);
            this.utter.voice = this.synthesis.getVoices()
                .find(voice => voice.lang === this.voiceLang && voice.name.includes('Google'))
        }
        this.utter.text = text;
        return this.utter;
    }
}