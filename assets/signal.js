
(() => {
  // Active transmission is stored only as timing units.
  // Retired test captures elsewhere in the source are intentionally unrelated.
  const stream = [3,-3,1,-1,1,-1,1,-1,1,-3,1,-1,3,-1,1,-3,1,-3,1,-7,3,-3,1,-1,1,-3,3,-1,3,-3,1,-3,1,-1,1,-1,1,-7,1,-1,1,-1,3,-1,1,-3,1,-1,1,-3,1,-1,1,-1,1,-1,3,-3,1,-7,3,-1,3,-3,1,-1,1,-3,3,-1,1,-3,1,-1,1,-1,3,-3,1,-1,1,-1,1,-7,1,-1,1,-1,3,-1,1,-3,3,-1,3,-1,3,-3,1,-1,1,-1,3,-3,1,-1,3,-1,1,-7,3,-1,3,-1,1,-1,3,-7,1,-1,1,-1,1,-3,1,-3,1,-1,1,-1,1,-1,3,-3,1,-3,3,-1,1];
  let ctx = null, token = 0, speed = 1;

  const $ = s => document.querySelector(s);
  const wave = $("#wave");
  const status = $("#signalStatus");

  function stop() {
    token++;
    if (ctx) { try { ctx.close(); } catch(e) {} ctx = null; }
    wave.classList.remove("live");
    status.textContent = "CARRIER IDLE";
  }

  async function play() {
    stop();
    const mine = ++token;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
    wave.classList.add("live");
    status.textContent = "CARRIER ACTIVE // LOOP";

    const unit = 0.105 / speed;
    const freq = 618;

    while (mine === token && ctx) {
      let t = ctx.currentTime + .06;
      for (const u of stream) {
        if (mine !== token || !ctx) return;
        if (u > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(.0001,t);
          gain.gain.exponentialRampToValueAtTime(.13,t+.008);
          gain.gain.setValueAtTime(.13,t+u*unit-.01);
          gain.gain.exponentialRampToValueAtTime(.0001,t+u*unit);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t); osc.stop(t+u*unit+.02);
          t += u*unit;
        } else {
          t += (-u)*unit;
        }
      }
      t += unit*9;
      const delay = Math.max(40,(t-ctx.currentTime)*1000);
      await new Promise(r=>setTimeout(r,delay));
    }
  }

  $("#play").onclick = () => { speed = 1; play(); };
  $("#stop").onclick = stop;
  $("#slow").onclick = () => { speed = .75; play(); };
})();
