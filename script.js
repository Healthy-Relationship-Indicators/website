// Set this to your Formspree form ID (the part after https://formspree.io/f/).
// Create one at https://formspree.io → New form.
const FORMSPREE_ID = "xyewodaw";

// Indicator taxonomy: one list drives both the form picker and the table.
const LABELS = {
  green: { name: "Green flag", field: "green_flags" },
  potential: { name: "Potential red flag", field: "potential_red_flags" },
  red: { name: "Red flag", field: "red_flags" },
};

const INDICATORS = [
  // Green flags
  ["Respecting boundaries", "green", "Accepts a 'no' or 'not yet' without pushing or sulking."],
  ["Consistent communication", "green", "Words and actions match; contact is steady, not hot and cold."],
  ["Healthy disagreement", "green", "Disagrees calmly, stays on topic, no insults or punishment."],
  ["Active listening", "green", "Asks follow-up questions and remembers what you said."],
  ["Reciprocity", "green", "Effort, questions and initiative go both ways."],
  ["Emotional openness", "green", "Names their own feelings and makes room for yours."],
  ["Accountability", "green", "Owns mistakes and apologizes without excuses."],
  ["Clear intentions", "green", "Is honest about what they are looking for."],
  ["Respect for independence", "green", "Supports your time, friends and interests apart from them."],
  ["Supportiveness", "green", "Encourages you and is glad about your wins."],
  ["Patience / no pressure", "green", "Lets things move at a pace that works for both."],
  ["Honesty & transparency", "green", "Answers straightforwardly; stories stay consistent."],

  // Potential red flags
  ["Love bombing", "potential", "Intense flattery, gifts or 'soulmate' talk very early."],
  ["Gaslighting indicators", "potential", "'That never happened', 'you're too sensitive' — makes you doubt your memory."],
  ["Hot and cold behavior", "potential", "Swings between very attentive and distant without explanation."],
  ["Breadcrumbing", "potential", "Occasional flirty messages that keep you hooked but never lead anywhere."],
  ["Guilt-tripping", "potential", "Uses guilt to get their way: 'after everything I've done for you…'."],
  ["Pressure to move fast", "potential", "Pushes for commitment, meeting or intimacy before you're ready."],
  ["Excessive jealousy", "potential", "Gets upset about your friends, likes or who you talk to."],
  ["Dismissing feelings", "potential", "Brushes off or mocks what you say you feel."],
  ["Future faking", "potential", "Big plans and promises that never turn into action."],
  ["Evasiveness", "potential", "Dodges simple questions about their life or intentions."],
  ["Blame shifting", "potential", "Every problem ends up being your fault."],
  ["Negging", "potential", "Backhanded compliments meant to lower your confidence."],

  // Red flags
  ["Excessive control", "red", "Tells you what to wear, where to go or who to see."],
  ["Boundary violations", "red", "Ignores a clear 'no' or keeps doing what you asked them to stop."],
  ["Monitoring / surveillance", "red", "Demands passwords, location or proof of where you are."],
  ["Isolation", "red", "Tries to cut you off from friends or family."],
  ["Threats or intimidation", "red", "Threatens you, themselves, or to share private things."],
  ["Insults and contempt", "red", "Name-calling, mocking, humiliation."],
  ["Sexual pressure or coercion", "red", "Pushes for sexual content or acts after you said no or hesitated."],
  ["Silent treatment as punishment", "red", "Withdraws contact to punish or control you."],
  ["Financial manipulation", "red", "Asks for money, or controls or exploits your finances."],
  ["Explosive anger", "red", "Rage out of proportion; you feel you must walk on eggshells."],
];

const form = document.getElementById("share-form");
const statusEl = document.getElementById("form-status");
const button = form.querySelector(".send");
const picker = document.getElementById("indicator-picker");
const table = document.getElementById("indicator-table");
const countEl = document.getElementById("assign-count");

function el(tag, attrs = {}, text) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

// Render picker (grouped chips) and the reference table.
for (const [key, label] of Object.entries(LABELS)) {
  const group = el("fieldset", { class: "ind-group " + key });
  group.append(el("legend", {}, label.name));
  for (const [name, k, desc] of INDICATORS) {
    if (k !== key) continue;
    const lab = el("label", { class: "ind-chip", title: desc });
    const box = el("input", { type: "checkbox", name: "indicator", value: name, "data-label": key });
    lab.append(box, document.createTextNode(" " + name));
    group.append(lab);
  }
  picker.append(group);
}
for (const [name, key, desc] of INDICATORS) {
  const tr = el("tr");
  tr.append(el("td", {}, name));
  const td = el("td");
  td.append(el("span", { class: "lbl " + key }, LABELS[key].name));
  tr.append(td, el("td", {}, desc));
  table.append(tr);
}

function updateCount() {
  const n = picker.querySelectorAll("input:checked").length;
  countEl.textContent = n ? n + " selected" : "";
}
picker.addEventListener("change", updateCount);

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

  // Send assigned indicators as one readable field per label.
  const data = new FormData(form);
  data.delete("indicator");
  for (const [key, label] of Object.entries(LABELS)) {
    const picked = [...picker.querySelectorAll(`input[data-label="${key}"]:checked`)].map((b) => b.value);
    data.append(label.field, picked.join(", "));
  }

  button.disabled = true;
  setStatus("Sending…");

  try {
    const res = await fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    form.reset();
    updateCount();
    setStatus("Sent! Thank you — this really helps. 💖 Share another?", "ok");
  } catch (err) {
    setStatus("Something went wrong. Please try again in a moment.", "err");
  } finally {
    button.disabled = false;
  }
});
