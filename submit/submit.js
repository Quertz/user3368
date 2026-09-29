
(() => {
  const form = document.querySelector("#submitForm");
  const status = document.querySelector("#status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const endpoint = window.CRYPTIC_SUBMIT_ENDPOINT;
    if (!endpoint || endpoint.includes("YOUR_ACCOUNT")) {
      status.textContent = "SUBMIT ENDPOINT IS NOT CONFIGURED.";
      return;
    }

    const payload = {
      email: document.querySelector("#email").value.trim(),
      phone: document.querySelector("#phone").value.trim(),
      answer: document.querySelector("#answer").value.trim()
    };

    status.textContent = "TRANSMITTING...";
    form.querySelector("button").disabled = true;

    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || "TRANSMISSION FAILED");

      status.textContent = `RECORDED // ${data.submitted_at}`;
      form.querySelectorAll("input,button").forEach(el => el.disabled = true);
    } catch (err) {
      status.textContent = String(err.message || err).toUpperCase();
      form.querySelector("button").disabled = false;
    }
  });
})();
