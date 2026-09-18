document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       ELEMENTS
    ========================= */

    const startAnalysisBtn = document.getElementById("startAnalysisBtn");

    const recordButton = document.getElementById("recordButton");
    const recordButtonText = document.getElementById("recordButtonText");

    const recordStatus = document.getElementById("recordStatus");
    const statusIndicator = document.getElementById("statusIndicator");

    const recordTimer = document.getElementById("recordTimer");
    const recordHelper = document.getElementById("recordHelper");

    const micCircle = document.getElementById("micCircle");
    const waveform = document.getElementById("waveform");

    const stepRecord = document.getElementById("stepRecord");
    const stepAnalyze = document.getElementById("stepAnalyze");
    const stepResult = document.getElementById("stepResult");

    const recordingPreview = document.getElementById("recordingPreview");

    const recordedAudio = document.getElementById("recordedAudio");
    const audioPlayButton = document.getElementById("audioPlayButton");

    const audioCurrentTime = document.getElementById("audioCurrentTime");
    const audioTotalTime = document.getElementById("audioTotalTime");

    const previewDuration = document.getElementById("previewDuration");

    const analyzeAudioButton = document.getElementById("analyzeAudioButton");
    const recordAgainButton = document.getElementById("recordAgainButton");

    const audioWavePreview = document.getElementById("audioWavePreview");


    /* =========================
       VARIABLES
    ========================= */

    let mediaRecorder = null;
    let mediaStream = null;

    let audioChunks = [];

    let timerInterval = null;
    let seconds = 0;

    let isRecording = false;

    let recordedBlob = null;
    let recordedAudioURL = null;


    /* =========================
       START BUTTON
    ========================= */

    if (startAnalysisBtn) {

        startAnalysisBtn.addEventListener("click", (e) => {

            e.preventDefault();

            const recorderSection =
                document.getElementById("recorder");

            if (recorderSection) {

                recorderSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

        });

    }


    /* =========================
       FORMAT TIME
    ========================= */

    function formatTime(total) {

        if (!Number.isFinite(total)) {
            return "00:00";
        }

        const minute = Math.floor(total / 60);
        const second = Math.floor(total % 60);

        return (
            String(minute).padStart(2, "0") +
            ":" +
            String(second).padStart(2, "0")
        );

    }


    /* =========================
       TIMER
    ========================= */

    function startTimer() {

        seconds = 0;

        recordTimer.textContent = "00:00";

        timerInterval = setInterval(() => {

            seconds++;

            recordTimer.textContent =
                formatTime(seconds);

        }, 1000);

    }


    function stopTimer() {

        if (timerInterval) {

            clearInterval(timerInterval);

            timerInterval = null;

        }

    }


    /* =========================
       UPDATE UI
    ========================= */

    function updateRecordingUI(recording) {

        if (recording) {

            recordButton.classList.add("recording");

            if (micCircle) {
                micCircle.classList.add("recording");
            }

            if (waveform) {
                waveform.classList.add("active");
            }

            if (statusIndicator) {
                statusIndicator.classList.add("recording");
            }

            recordStatus.textContent =
                "Sedang merekam";

            recordHelper.textContent =
                "Tekan tombol lagi untuk menghentikan rekaman";

            recordButtonText.textContent =
                "STOP REKAM";

        } else {

            recordButton.classList.remove("recording");

            if (micCircle) {
                micCircle.classList.remove("recording");
            }

            if (waveform) {
                waveform.classList.remove("active");
            }

            if (statusIndicator) {
                statusIndicator.classList.remove("recording");
            }

        }

    }


    /* =========================
       FIND SUPPORTED MIME TYPE
    ========================= */

    function getSupportedMimeType() {

        const mimeTypes = [

            "audio/webm;codecs=opus",

            "audio/webm",

            "audio/mp4",

            "audio/ogg;codecs=opus",

            "audio/ogg"

        ];

        for (const type of mimeTypes) {

            if (
                typeof MediaRecorder !== "undefined" &&
                MediaRecorder.isTypeSupported(type)
            ) {

                return type;

            }

        }

        return "";

    }


    /* =========================
       START RECORDING
    ========================= */

    async function startRecording() {

        try {

            /* =========================
               CHECK BROWSER SUPPORT
            ========================= */

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                throw new Error(
                    "Browser tidak mendukung akses mikrofon."
                );

            }

            if (
                typeof MediaRecorder === "undefined"
            ) {

                throw new Error(
                    "Browser tidak mendukung MediaRecorder."
                );

            }


            /* =========================
               REQUEST MICROPHONE
            ========================= */

            mediaStream =
                await navigator.mediaDevices.getUserMedia({

                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1
                    }

                });


            /* =========================
               CHECK AUDIO TRACK
            ========================= */

            const audioTracks =
                mediaStream.getAudioTracks();

            if (
                !audioTracks ||
                audioTracks.length === 0
            ) {

                throw new Error(
                    "Tidak ada microphone audio track."
                );

            }


            const audioTrack =
                audioTracks[0];

            console.log(
                "Microphone:",
                audioTrack.label
            );

            console.log(
                "Microphone settings:",
                audioTrack.getSettings()
            );


            /* =========================
               RESET CHUNKS
            ========================= */

            audioChunks = [];


            /* =========================
               SELECT MIME TYPE
            ========================= */

            const supportedMimeType =
                getSupportedMimeType();

            console.log(
                "Audio MIME type:",
                supportedMimeType || "Browser default"
            );


            /* =========================
               CREATE MEDIA RECORDER
            ========================= */

            if (supportedMimeType) {

                mediaRecorder =
                    new MediaRecorder(
                        mediaStream,
                        {
                            mimeType: supportedMimeType
                        }
                    );

            } else {

                mediaRecorder =
                    new MediaRecorder(
                        mediaStream
                    );

            }


            /* =========================
               DATA AVAILABLE
            ========================= */

            mediaRecorder.ondataavailable =
                (event) => {

                    console.log(
                        "Audio chunk:",
                        event.data.size,
                        "bytes"
                    );

                    if (
                        event.data &&
                        event.data.size > 0
                    ) {

                        audioChunks.push(
                            event.data
                        );

                    }

                };


            /* =========================
               RECORDING ERROR
            ========================= */

            mediaRecorder.onerror =
                (event) => {

                    console.error(
                        "MediaRecorder error:",
                        event.error
                    );

                    recordStatus.textContent =
                        "Terjadi masalah saat merekam";

                    recordHelper.textContent =
                        "Coba izinkan microphone lalu rekam kembali.";

                };


            /* =========================
               STOP RECORDING
            ========================= */

            mediaRecorder.onstop =
                async () => {

                    console.log(
                        "Recording stopped."
                    );

                    console.log(
                        "Total chunks:",
                        audioChunks.length
                    );


                    /* =========================
                       CHECK CHUNKS
                    ========================= */

                    if (
                        audioChunks.length === 0
                    ) {

                        recordStatus.textContent =
                            "Rekaman tidak tersimpan";

                        recordHelper.textContent =
                            "Tidak ada data audio yang berhasil direkam. Coba lagi.";

                        recordButton.disabled = false;

                        recordButtonText.textContent =
                            "MULAI REKAM";

                        if (mediaStream) {

                            mediaStream
                                .getTracks()
                                .forEach(
                                    track => track.stop()
                                );

                        }

                        return;

                    }


                    /* =========================
                       CREATE AUDIO BLOB
                    ========================= */

                    const recorderMimeType =
                        mediaRecorder.mimeType ||
                        supportedMimeType ||
                        "audio/webm";


                    recordedBlob =
                        new Blob(
                            audioChunks,
                            {
                                type: recorderMimeType
                            }
                        );


                    console.log(
                        "Final audio blob:",
                        recordedBlob.size,
                        "bytes"
                    );

                    console.log(
                        "Final audio type:",
                        recordedBlob.type
                    );


                    /* =========================
                       CHECK FILE SIZE
                    ========================= */

                    if (
                        recordedBlob.size < 100
                    ) {

                        recordStatus.textContent =
                            "Rekaman terlalu kosong";

                        recordHelper.textContent =
                            "Audio tidak berhasil tersimpan. Coba rekam lagi.";

                        recordButton.disabled = false;

                        recordButtonText.textContent =
                            "MULAI REKAM";

                        if (mediaStream) {

                            mediaStream
                                .getTracks()
                                .forEach(
                                    track => track.stop()
                                );

                        }

                        return;

                    }


                    /* =========================
                       REMOVE OLD URL
                    ========================= */

                    if (recordedAudioURL) {

                        URL.revokeObjectURL(
                            recordedAudioURL
                        );

                    }


                    /* =========================
                       CREATE NEW AUDIO URL
                    ========================= */

                    recordedAudioURL =
                        URL.createObjectURL(
                            recordedBlob
                        );


                    console.log(
                        "Audio URL created:",
                        recordedAudioURL
                    );


                    /* =========================
                       SET AUDIO PLAYER
                    ========================= */

                    recordedAudio.src =
                        recordedAudioURL;

                    recordedAudio.preload =
                        "metadata";

                    recordedAudio.load();


                    /* =========================
                       SHOW PREVIEW
                    ========================= */

                    recordingPreview.classList.add(
                        "show"
                    );


                    previewDuration.textContent =
                        recordTimer.textContent;

                    audioTotalTime.textContent =
                        recordTimer.textContent;


                    recordButton.disabled =
                        true;

                    recordButtonText.textContent =
                        "REKAMAN SIAP";

                    recordStatus.textContent =
                        "Rekaman berhasil dibuat";

                    recordHelper.textContent =
                        "Tekan tombol play untuk mendengarkan rekaman.";


                    /* =========================
                       UPDATE STEPS
                    ========================= */

                    stepRecord.classList.remove(
                        "active"
                    );

                    stepRecord.classList.add(
                        "completed"
                    );

                    stepAnalyze.classList.add(
                        "active"
                    );


                    /* =========================
                       STOP MICROPHONE
                    ========================= */

                    if (mediaStream) {

                        mediaStream
                            .getTracks()
                            .forEach(
                                track => track.stop()
                            );

                    }

                };


            /* =========================
               START MEDIA RECORDER
            ========================= */

            mediaRecorder.start(250);

            console.log(
                "Recording started."
            );


            isRecording = true;

            startTimer();

            updateRecordingUI(true);

        }

        catch (error) {

            console.error(
                "Microphone error:",
                error
            );

            isRecording = false;

            stopTimer();

            updateRecordingUI(false);


            recordStatus.textContent =
                "Mikrofon tidak dapat digunakan";

            recordHelper.textContent =
                "Pastikan izin mikrofon sudah diberikan dan coba lagi.";

        }

    }


    /* =========================
       STOP RECORDING
    ========================= */

    function stopRecording() {

        if (
            mediaRecorder &&
            mediaRecorder.state === "recording"
        ) {

            mediaRecorder.stop();

        }

        isRecording = false;

        stopTimer();

        updateRecordingUI(false);

    }


    /* =========================
       RECORD BUTTON
    ========================= */

    if (recordButton) {

        recordButton.addEventListener(
            "click",
            () => {

                if (!isRecording) {

                    startRecording();

                } else {

                    stopRecording();

                }

            }
        );

    }


    /* =========================
       PLAY AUDIO
    ========================= */

    if (audioPlayButton) {

        audioPlayButton.addEventListener(
            "click",
            async () => {

                if (
                    !recordedAudio ||
                    !recordedAudio.src
                ) {

                    console.warn(
                        "Tidak ada audio untuk diputar."
                    );

                    return;

                }


                try {

                    if (
                        recordedAudio.paused
                    ) {

                        console.log(
                            "Trying to play audio..."
                        );

                        await recordedAudio.play();

                    } else {

                        recordedAudio.pause();

                    }

                }

                catch (error) {

                    console.error(
                        "Audio playback error:",
                        error
                    );

                    recordHelper.textContent =
                        "Rekaman tidak dapat diputar. Coba Rekam Ulang.";

                }

            }
        );

    }


    /* =========================
       AUDIO PLAY EVENT
    ========================= */

    if (recordedAudio) {

        recordedAudio.addEventListener(
            "play",
            () => {

                audioPlayButton.textContent =
                    "Ⅱ";

                audioWavePreview.classList.add(
                    "playing"
                );

            }
        );


        recordedAudio.addEventListener(
            "pause",
            () => {

                audioPlayButton.textContent =
                    "▶";

                audioWavePreview.classList.remove(
                    "playing"
                );

            }
        );


        recordedAudio.addEventListener(
            "ended",
            () => {

                audioPlayButton.textContent =
                    "▶";

                audioWavePreview.classList.remove(
                    "playing"
                );

            }
        );


        recordedAudio.addEventListener(
            "timeupdate",
            () => {

                audioCurrentTime.textContent =
                    formatTime(
                        recordedAudio.currentTime
                    );

            }
        );


        recordedAudio.addEventListener(
            "loadedmetadata",
            () => {

                console.log(
                    "Audio metadata loaded."
                );

                console.log(
                    "Audio duration:",
                    recordedAudio.duration
                );

                if (
                    Number.isFinite(
                        recordedAudio.duration
                    )
                ) {

                    const duration =
                        formatTime(
                            recordedAudio.duration
                        );

                    audioTotalTime.textContent =
                        duration;

                    previewDuration.textContent =
                        duration;

                }

            }
        );


        /* =========================
           AUDIO ERROR
        ========================= */

        recordedAudio.addEventListener(
            "error",
            () => {

                console.error(
                    "HTML audio error:",
                    recordedAudio.error
                );

                recordHelper.textContent =
                    "Format rekaman tidak dapat diputar. Coba Rekam Ulang.";

            }
        );

    }


    /* =========================
       RECORD AGAIN
    ========================= */

    if (recordAgainButton) {

        recordAgainButton.addEventListener(
            "click",
            () => {

                if (recordedAudio) {

                    recordedAudio.pause();

                    recordedAudio.currentTime = 0;

                }


                if (recordedAudioURL) {

                    URL.revokeObjectURL(
                        recordedAudioURL
                    );

                    recordedAudioURL =
                        null;

                }


                recordedBlob = null;

                audioChunks = [];


                if (recordedAudio) {

                    recordedAudio.src = "";

                    recordedAudio.load();

                }


                recordingPreview.classList.remove(
                    "show"
                );


                recordButton.disabled =
                    false;

                recordButtonText.textContent =
                    "MULAI REKAM";


                recordStatus.textContent =
                    "Siap merekam";


                recordHelper.textContent =
                    "Tekan tombol di bawah untuk mulai merekam";


                recordTimer.textContent =
                    "00:00";


                audioCurrentTime.textContent =
                    "00:00";

                audioTotalTime.textContent =
                    "00:00";


                stepRecord.classList.add(
                    "active"
                );

                stepRecord.classList.remove(
                    "completed"
                );


                stepAnalyze.classList.remove(
                    "active",
                    "completed"
                );

                stepResult.classList.remove(
                    "active",
                    "completed"
                );

            }
        );

    }


    /* =========================
       AUDIO ANALYSIS
    ========================= */

    async function calculateAudioScore(blob) {

        try {

            const arrayBuffer =
                await blob.arrayBuffer();

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            /*
             * CATATAN:
             * Skor ini hanya SIMULASI karakteristik audio
             * untuk keperluan edukasi.
             * Bukan persentase kemungkinan terkena TBC
             * dan bukan diagnosis medis.
             */

            if (!AudioContext) {

                return Math.floor(
                    10 + Math.random() * 86
                );

            }

            const audioContext =
                new AudioContext();

            const audioBuffer =
                await audioContext.decodeAudioData(
                    arrayBuffer
                );

            const data =
                audioBuffer.getChannelData(0);

            let sum = 0;
            let crossings = 0;

            for (
                let i = 0;
                i < data.length;
                i++
            ) {

                sum +=
                    data[i] *
                    data[i];

                if (
                    i > 0 &&
                    (
                        (
                            data[i - 1] < 0 &&
                            data[i] >= 0
                        ) ||
                        (
                            data[i - 1] >= 0 &&
                            data[i] < 0
                        )
                    )
                ) {

                    crossings++;

                }

            }

            const rms =
                Math.sqrt(
                    sum / data.length
                );

            const zcr =
                crossings / data.length;

            const duration =
                audioBuffer.duration;

            console.log(
                "Audio duration:",
                duration
            );

            console.log(
                "Audio RMS:",
                rms
            );

            console.log(
                "Audio ZCR:",
                zcr
            );


            /*
             * RANDOM SCORE
             *
             * Semua angka dari 10 sampai 95%
             * bisa muncul.
             */
            let score =
                Math.floor(
                    10 + Math.random() * 86
                );


            /*
             * Karakteristik audio hanya memberikan
             * sedikit pengaruh tambahan.
             */

            if (duration >= 2) {
                score += 1;
            }

            if (rms > 0.01) {
                score += 2;
            }

            if (zcr > 0.01) {
                score += 2;
            }


            /*
             * Tambahan variasi random.
             */
            score +=
                Math.floor(
                    Math.random() * 9
                ) - 4;


            /*
             * Batasi hasil pada rentang 10–95%.
             */
            score =
                Math.max(
                    10,
                    Math.min(
                        95,
                        score
                    )
                );


            await audioContext.close();

            return score;

        }

        catch (error) {

            console.error(
                "Audio analysis error:",
                error
            );

            /*
             * Jika analisis gagal,
             * tetap berikan skor simulasi random.
             */
            return Math.floor(
                10 + Math.random() * 86
            );

        }

    }


    /* =========================
       ANALYZE AUDIO BUTTON
    ========================= */

    if (analyzeAudioButton) {

        analyzeAudioButton.addEventListener(
            "click",
            async () => {

                if (!recordedBlob) {

                    return;

                }


                analyzeAudioButton.disabled =
                    true;


                analyzeAudioButton.innerHTML =
                    "<span>◌</span> Menganalisis...";


                const score =
                    await calculateAudioScore(
                        recordedBlob
                    );


                const result = {

                    score: score,

                    duration:
                        recordTimer.textContent

                };


                localStorage.setItem(
                    "coughAnalyzerResult",
                    JSON.stringify(result)
                );


                stepAnalyze.classList.remove(
                    "active"
                );

                stepAnalyze.classList.add(
                    "completed"
                );


                stepResult.classList.add(
                    "active"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "hasil.html";

                    },
                    700
                );

            }
        );

    }


    /* =========================
       MOBILE MENU
    ========================= */

    const mobileMenu =
        document.querySelector(
            ".mobile-menu"
        );


    const desktopMenu =
        document.querySelector(
            ".desktop-menu"
        );


    if (
        mobileMenu &&
        desktopMenu
    ) {

        mobileMenu.addEventListener(
            "click",
            () => {

                desktopMenu.classList.toggle(
                    "mobile-open"
                );

            }
        );

    }

});