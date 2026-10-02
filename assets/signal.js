(() => {
  /*
    SIGNAL audio engine
    -------------------
    Primary path: runtime-generated PCM/WAV played by HTMLAudioElement.
    No MP3/audio asset exists on the server.
    Fallback path: Web Audio oscillator.

    The active message is stored only as timing units.
  */
  const stream = [3,-3,1,-1,1,-1,1,-1,1,-3,1,-1,3,-1,1,-3,1,-3,1,-7,3,-3,1,-1,1,-3,3,-1,3,-3,1,-3,1,-1,1,-1,1,-7,1,-1,1,-1,3,-1,1,-3,1,-1,1,-3,1,-1,1,-1,1,-1,3,-3,1,-7,3,-1,3,-3,1,-1,1,-3,3,-1,1,-3,1,-1,1,-1,3,-3,1,-1,1,-1,1,-7,1,-1,1,-1,3,-1,1,-3,3,-1,3,-1,3,-3,1,-1,1,-1,3,-3,1,-1,3,-1,1,-7,3,-1,3,-1,1,-1,3,-7,1,-1,1,-1,1,-3,1,-3,1,-1,1,-1,1,-1,3,-3,1,-3,3,-1,1];

  const $ = (s) => document.querySelector(s);
  const wave = $("#wave");
  const status = $("#signalStatus");

  let player = null;
  let blobUrl = null;
  let ctx = null;
  let webAudioToken = 0;
  let speed = 1;

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function cleanupMedia() {
    if (player) {
      try {
        player.pause();
        player.removeAttribute("src");
        player.load();
      } catch (e) {}
      player = null;
    }
    if (blobUrl) {
      try { URL.revokeObjectURL(blobUrl); } catch (e) {}
      blobUrl = null;
    }
  }

  function cleanupWebAudio() {
    webAudioToken++;
    if (ctx) {
      try { ctx.close(); } catch (e) {}
      ctx = null;
    }
  }

  function stop() {
    cleanupMedia();
    cleanupWebAudio();
    wave?.classList.remove("live");
    setStatus("CARRIER IDLE");
  }

  // Build one complete loop as mono 16-bit PCM WAV.
  // This is intentionally generated locally from timing units.
  function buildWav(playbackSpeed = 1) {
    const sampleRate = 22050;
    const unitSeconds = 0.105 / playbackSpeed;
    const frequency = 618;
    const amplitude = 0.24;

    const segments = [];
    for (const u of stream) {
      if (u > 0) {
        segments.push({ tone: true, seconds: u * unitSeconds });
      } else {
        segments.push({ tone: false, seconds: (-u) * unitSeconds });
      }
    }
    // Pause between repeats.
    segments.push({ tone: false, seconds: 9 * unitSeconds });

    const totalSamples = segments.reduce(
      (n, s) => n + Math.max(1, Math.round(s.seconds * sampleRate)), 0
    );

    const bytesPerSample = 2;
    const dataSize = totalSamples * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function ascii(offset, text) {
      for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    }

    ascii(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    ascii(8, "WAVE");
    ascii(12, "fmt ");
    view.setUint32(16, 16, true);       // PCM fmt chunk
    view.setUint16(20, 1, true);        // PCM
    view.setUint16(22, 1, true);        // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    ascii(36, "data");
    view.setUint32(40, dataSize, true);

    let sampleIndex = 0;
    let phase = 0;
    const twoPi = Math.PI * 2;
    const phaseStep = twoPi * frequency / sampleRate;

    for (const seg of segments) {
      const count = Math.max(1, Math.round(seg.seconds * sampleRate));

      for (let i = 0; i < count; i++) {
        let sample = 0;

        if (seg.tone) {
          // Very short envelope removes clicks at symbol edges.
          const edge = Math.min(i, count - 1 - i);
          const fadeSamples = Math.max(1, Math.round(sampleRate * 0.006));
          const envelope = Math.min(1, edge / fadeSamples);
          sample = Math.sin(phase) * amplitude * envelope;
          phase += phaseStep;
          if (phase > twoPi) phase -= twoPi;
        }

        view.setInt16(44 + sampleIndex * 2, Math.round(sample * 32767), true);
        sampleIndex++;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  async function playNative(playbackSpeed = 1) {
    cleanupMedia();
    cleanupWebAudio();

    // Blob creation happens directly in the tap/click call chain.
    const blob = buildWav(playbackSpeed);
    blobUrl = URL.createObjectURL(blob);

    const audio = new Audio();
    player = audio;
    audio.preload = "auto";
    audio.loop = true;
    audio.playsInline = true;
    audio.src = blobUrl;

    // iOS Safari: invoke play() immediately from the user activation.
    const promise = audio.play();

    if (promise && typeof promise.then === "function") {
      await promise;
    }

    wave?.classList.add("live");
    setStatus("CARRIER ACTIVE // LOOP");
  }

  // Fallback for browsers where Blob/WAV playback fails.
  function playWebAudioFallback(playbackSpeed = 1) {
    cleanupMedia();
    cleanupWebAudio();

    const token = ++webAudioToken;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error("NO AUDIO ENGINE");

    ctx = new AudioCtx();
    const unit = 0.105 / playbackSpeed;
    const frequency = 618;

    // Schedule immediately. Do not wait for resume() before scheduling;
    // Safari user activation is safest if all audio setup stays synchronous.
    let t = ctx.currentTime + 0.035;

    const scheduleLoop = () => {
      if (!ctx || token !== webAudioToken) return;

      t = Math.max(t, ctx.currentTime + 0.035);

      for (const u of stream) {
        if (u > 0) {
          const duration = u * unit;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = frequency;

          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.13, t + 0.006);
          gain.gain.setValueAtTime(0.13, Math.max(t + 0.007, t + duration - 0.008));
          gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + duration + 0.02);
          t += duration;
        } else {
          t += (-u) * unit;
        }
      }

      t += unit * 9;
      const ms = Math.max(50, (t - ctx.currentTime - 0.15) * 1000);
      window.setTimeout(scheduleLoop, ms);
    };

    scheduleLoop();

    // Resume from the same direct gesture without awaiting first.
    try {
      const r = ctx.resume();
      if (r && typeof r.catch === "function") r.catch(() => {});
    } catch (e) {}

    wave?.classList.add("live");
    setStatus("CARRIER ACTIVE // LOOP");
  }

  async function start(playbackSpeed = 1) {
    stop();
    speed = playbackSpeed;
    setStatus("OPENING CARRIER...");

    try {
      await playNative(playbackSpeed);
    } catch (nativeError) {
      console.warn("Native WAV playback failed; using Web Audio fallback.", nativeError);
      try {
        playWebAudioFallback(playbackSpeed);
      } catch (fallbackError) {
        console.error("Audio fallback failed.", fallbackError);
        setStatus("AUDIO BLOCKED // TAP PLAY AGAIN");
        wave?.classList.remove("live");
      }
    }
  }

  // Use pointerup where available so the call is unquestionably user-initiated on iOS.
  function bindUserAction(el, fn) {
    if (!el) return;
    let handledPointer = false;

    el.addEventListener("pointerup", (e) => {
      handledPointer = true;
      e.preventDefault();
      fn();
    }, { passive: false });

    el.addEventListener("click", (e) => {
      if (handledPointer) {
        handledPointer = false;
        return;
      }
      e.preventDefault();
      fn();
    });
  }

  bindUserAction($("#play"), () => start(1));
  bindUserAction($("#slow"), () => start(0.75));
  bindUserAction($("#stop"), stop);

  // iOS can kill/interupt audio after backgrounding. Do not attempt to silently
  // restart it; that may be blocked again. Reset cleanly and require one tap.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      setStatus("CARRIER IDLE // TAP PLAY");
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      stop();
      setStatus("CARRIER IDLE // TAP PLAY");
    }
  });
})();

/*
 * ARCHIVE RESIDUE // 62c00089aa
 * This block has no runtime role.
 *
 * CONTINUED FRACTION:
 * α = [3; 7,1,4,1,5,9,2,6,5,3,5,8,9,7,9].
 * Take convergents p_n/q_n for prime n only.
 * Define c_n = (p_n + 3q_n) mod 9973.
 * Cross-reference points to a catalogue that was never digitized.
 *
 * witness-order: 6-68-149
 * seal: ORPHEUS-31
 */
(() => {
  const ledger_62c00089aa = Object.freeze({
    status: "REJECTED",
    witness: "VERRE-91",
    fragments: ["FROST-022", "NULL-771", "DELTA-72", "NORTH/17", "ECHO_307", "VITRUM-04", "ORPHEUS-31", "VERRE-91"],
    verses: [
      "Ordo fictus ordinem verum celat.",
      "Duo lumina, tres umbrae, nulla via.",
      "Чёрное стекло не отражает ответа.",
      "Nox memoriam mutat, non veritatem.",
      "Старая машина считает без причины.",
      "Ce qui revient n’est jamais identique.",
      "Archivum mentitur ubi pulvis loquitur.",
      "Les lettres froides refusent la lumière.",
      "La boîte vide conserve un faux secret.",
      "Sub signo cinereo nomen deletum est.",
      "Falsa memoria veram portam imitatur.",
      "Vox secunda nullum testem habet.",
      "Rien dans cette marge n’est une instruction.",
      "In tabula vacua ordo iam periit."
    ],
    permutation: [8, 4, 7, 1, 3, 2, 9, 5, 6],
    checksum: "19-34-0A"
  });
  if (false && ledger_62c00089aa.status === "CANONICAL") {
    console.log(ledger_62c00089aa.fragments.join(":"));
  }
  void ledger_62c00089aa;
})();
/*
 * Vtipky by Franta, libili se?
 * @takeanotherusername
 */