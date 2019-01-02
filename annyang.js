'use strict';

const _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
} : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

//! annyang
//! version : 2.6.0
//! author  : Tal Ater @TalAter
//! license : MIT
//! https://www.TalAter.com/annyang/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD + global
        define([], function () {
            return root.annyang = factory(root);
        });
    } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
        // CommonJS
        module.exports = factory(root);
    } else {
        // Browser globals
        root.annyang = factory(root);
    }
})(typeof window !== 'undefined' ? window : undefined, function (root, undefined) {
    "use strict";

    let annyang;

    // Get the SpeechRecognition object, while handling browser prefixes
    let SpeechRecognition = root.SpeechRecognition || root.webkitSpeechRecognition || root.mozSpeechRecognition || root.msSpeechRecognition || root.oSpeechRecognition;

    // Check browser support
    // This is done as early as possible, to make it as fast as possible for unsupported browsers
    if (!SpeechRecognition) {
        return null;
    }

    let recognition;
    let autoRestart;
    let lastStartedAt = 0;
    let autoRestartCount = 0;
    let pauseListening = false;
    let _isListening = false;

	let resultListeners = [];
    const parseResults = function parseResults(results) {
        for (let i = 0; i < resultListeners.length; i++)
			resultListeners[i](results);
    };

    annyang = {
		addListener(func) {
			resultListeners.push(func);
		},
        init: function init() {

            // initiate SpeechRecognition
            recognition = new SpeechRecognition();

            // Set the max number of alternative transcripts to try and match with a command
            recognition.maxAlternatives = 5;

            // In HTTPS, turn off continuous mode for faster results.
            // In HTTP,  turn on  continuous mode for much slower results, but no repeating security notices
            recognition.continuous = root.location.protocol === 'http:';

            // Sets the language to the default 'en-US'. This can be changed with annyang.setLanguage()
            recognition.lang = 'ru';

            recognition.onstart = function () {
                _isListening = true;
            };

            recognition.onsoundstart = function () {
            };

            recognition.onerror = function (event) {
                switch (event.error) {
                    case 'network':
                        break;
                    case 'not-allowed':
                    case 'service-not-allowed':
                        // if permission to use the mic is denied, turn off auto-restart
                        autoRestart = false;
                }
            };

            recognition.onend = function () {
                _isListening = false;

                // annyang will auto restart if it is closed automatically and not by user action.
                if (autoRestart) {
                    // play nicely with the browser, and never restart annyang automatically more than once per second
                    const timeSinceLastStart = new Date().getTime() - lastStartedAt;
                    autoRestartCount += 1;

                    if (timeSinceLastStart < 1000)
                        setTimeout(() => annyang.start({paused: pauseListening}), 1000 - timeSinceLastStart);
                    else
                        annyang.start({paused: pauseListening});
                }
            };

            recognition.onresult = function (event) {
                // Map the results to an array
                const SpeechRecognitionResult = event.results[event.resultIndex];
                const results = [];

                for (let k = 0; k < SpeechRecognitionResult.length; k++)
                    results[k] = SpeechRecognitionResult[k].transcript;

                parseResults(results);
            };
        },


        start(options) {

            options = options || {};

            // Set paused or default
            if (options.paused !== undefined) pauseListening = !!options.paused;
            else pauseListening = false;

            // Set autoRestart or default
            if (options.autoRestart !== undefined) autoRestart = !!options.autoRestart;
            else autoRestart = true;

            lastStartedAt = new Date().getTime();

            recognition.start();
        },

        /**
         * Stop listening, and turn off mic.
         */
        abort() {
            autoRestart = false;
            autoRestartCount = 0;
            recognition.abort();
        },

        pause() {
            pauseListening = true;
        },

        resume() {
            annyang.start();
        },

        setLanguage(language) {
            recognition.lang = language;
        },
    };

    return annyang;
});