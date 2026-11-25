// Set this to your Formspree form ID (the part after https://formspree.io/f/).
// Create one at https://formspree.io → New form.
const FORMSPREE_ID = "YOUR_FORM_ID";

const form = document.getElementById("share-form");
const statusEl = document.getElementById("form-status");
const button = form.querySelector(".send");

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "form-status" + (kind ? " " + kind : "");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const conversation = form.conversation.value.trim();
  if (conversation.length < 20) {
    setStatus("Please paste a bit more of the conversation.", "err");
    form.conversation.focus();
    return;
  }
  if (!form.consent.checked) {
    setStatus("Please confirm you removed identifying details and agree to the data use.", "err");
    return;
  }
  if (!FORMSPREE_ID || FORMSPREE_ID === "YOUR_FORM_ID") {
    setStatus("Submissions open soon — the form isn't connected yet.", "err");
    return;
  }

  button.disabled = true;
  setStatus("Sending…");

  try {
    const res = await fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    form.reset();
    setStatus("Sent! Thank you — this really helps. 💖 Share another?", "ok");
  } catch (err) {
    setStatus("Something went wrong. Please try again in a moment.", "err");
  } finally {
    button.disabled = false;
  }
});
