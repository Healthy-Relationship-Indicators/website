// Set this to your Formspree form ID (the part after https://formspree.io/f/).
// Create one at https://formspree.io → New form.
const FORMSPREE_ID = "xyewodaw";

// Indicator taxonomy: one list drives both the form picker and the table.
// The English name is the value submitted; translations are in i18n.js.
const LABELS = {
  green: { field: "green_flags" },
  potential: { field: "potential_red_flags" },
  red: { field: "red_flags" },
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

// English strings that only exist in JS (the rest is read from the HTML).
const EN_JS = {
  "form.selected": "{n} selected",
  "status.short": "Please paste a bit more of the conversation.",
  "status.consent": "Please confirm you removed identifying details and agree to the data use.",
  "status.notConnected": "Submissions open soon — the form isn't connected yet.",
  "status.sending": "Sending…",
  "status.ok": "Sent! Thank you — this really helps. 💖 Share another?",
  "status.err": "Something went wrong. Please try again in a moment.",
};

const SUPPORTED = ["en", "pl", "es"];
const form = document.getElementById("share-form");
const statusEl = document.getElementById("form-status");
const button = form.querySelector(".send");
const picker = document.getElementById("indicator-picker");
const table = document.getElementById("indicator-table");
const countEl = document.getElementById("assign-count");
const langField = document.getElementById("language-field");

// ---- i18n ----
// Capture the English text from the page once, so switching back to EN works.
const EN = { ...EN_JS };
document.querySelectorAll("[data-i18n]").forEach((n) => (EN[n.dataset.i18n] = n.innerHTML.trim()));
document.querySelectorAll("[data-i18n-ph]").forEach((n) => (EN[n.dataset.i18nPh] = n.getAttribute("placeholder")));
document.querySelectorAll("[data-i18n-content]").forEach((n) => (EN[n.dataset.i18nContent] = n.getAttribute("content")));

let lang = "en";
let lastStatus = null; // [key, kind] so the status message re-translates too

function t(key) {
  return (I18N[lang] && I18N[lang][key]) || EN[key] || key;
}

function indText(name, desc) {
  const tr = I18N_INDICATORS[lang] && I18N_INDICATORS[lang][name];
  return tr ? { name: tr[0], desc: tr[1] } : { name, desc };
}

function pickLanguage() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (SUPPORTED.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem("lang");
    if (SUPPORTED.includes(saved)) return saved;
  } catch (_) {}
  for (const l of navigator.languages || [navigator.language || "en"]) {
    const code = String(l).slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(code)) return code;
  }
  return "en";
}

function setLanguage(next) {
  lang = SUPPORTED.includes(next) ? next : "en";
  document.documentElement.lang = lang;
  langField.value = lang;
  try { localStorage.setItem("lang", lang); } catch (_) {}

  document.querySelectorAll("[data-i18n]").forEach((n) => (n.innerHTML = t(n.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((n) => n.setAttribute("placeholder", t(n.dataset.i18nPh)));
  document.querySelectorAll("[data-i18n-content]").forEach((n) => n.setAttribute("content", t(n.dataset.i18nContent)));
  document.querySelectorAll(".lang-switch button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));

  renderIndicators();
  if (lastStatus) setStatus(...lastStatus);
}

document.querySelectorAll(".lang-switch button").forEach((b) =>
  b.addEventListener("click", () => setLanguage(b.dataset.lang)));

// ---- indicators ----
function el(tag, attrs = {}, text) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

function renderIndicators() {
  const checked = new Set([...picker.querySelectorAll("input:checked")].map((b) => b.value));
  picker.replaceChildren();
  table.replaceChildren();

  for (const key of Object.keys(LABELS)) {
    const group = el("fieldset", { class: "ind-group " + key });
    group.append(el("legend", {}, t("lbl." + key)));
    for (const [name, k, desc] of INDICATORS) {
      if (k !== key) continue;
      const tx = indText(name, desc);
      const lab = el("label", { class: "ind-chip", title: tx.desc });
      const box = el("input", { type: "checkbox", name: "indicator", value: name, "data-label": key });
      box.checked = checked.has(name);
      lab.append(box, document.createTextNode(" " + tx.name));
      group.append(lab);
    }
    picker.append(group);
  }

  for (const [name, key, desc] of INDICATORS) {
    const tx = indText(name, desc);
    const tr = el("tr");
    tr.append(el("td", {}, tx.name));
    const td = el("td");
    td.append(el("span", { class: "lbl " + key }, t("lbl." + key)));
    tr.append(td, el("td", {}, tx.desc));
    table.append(tr);
  }
  updateCount();
}

function updateCount() {
  const n = picker.querySelectorAll("input:checked").length;
  countEl.textContent = n ? t("form.selected").replace("{n}", n) : "";
}
picker.addEventListener("change", updateCount);

// ---- form ----
function setStatus(key, kind) {
  lastStatus = key ? [key, kind] : null;
  statusEl.textContent = key ? t(key) : "";
  statusEl.className = "form-status" + (kind ? " " + kind : "");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const conversation = form.conversation.value.trim();
  if (conversation.length < 20) {
    setStatus("status.short", "err");
    form.conversation.focus();
    return;
  }
  if (!form.consent.checked) {
    setStatus("status.consent", "err");
    return;
  }
  if (!FORMSPREE_ID || FORMSPREE_ID === "YOUR_FORM_ID") {
    setStatus("status.notConnected", "err");
    return;
  }

  // Send assigned indicators (English names) as one readable field per label.
  const data = new FormData(form);
  data.delete("indicator");
  for (const [key, label] of Object.entries(LABELS)) {
    const picked = [...picker.querySelectorAll(`input[data-label="${key}"]:checked`)].map((b) => b.value);
    data.append(label.field, picked.join(", "));
  }

  button.disabled = true;
  setStatus("status.sending");

  try {
    const res = await fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    form.reset();
    langField.value = lang;
    updateCount();
    setStatus("status.ok", "ok");
  } catch (err) {
    setStatus("status.err", "err");
  } finally {
    button.disabled = false;
  }
});

setLanguage(pickLanguage());
