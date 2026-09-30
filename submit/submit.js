(() => {
  const form = document.querySelector("#submitForm, form.form");
  if (!form) return;

  // Compatibility layer for an older cached submit/index.html.
  // Do NOT intercept submit; browser performs a normal HTML POST.
  form.setAttribute("action", "/api/submit");
  form.setAttribute("method", "post");
  form.setAttribute("accept-charset", "UTF-8");

  // Older markup may have inputs without name= attributes.
  const email = form.querySelector('input[type="email"], #email');
  const phone = form.querySelector('input[type="tel"], #phone');
  const answer = form.querySelector('input[name="answer"], #answer, .answer input');

  if (email) email.setAttribute("name", "email");
  if (phone) phone.setAttribute("name", "phone");
  if (answer) answer.setAttribute("name", "answer");

  console.log("CRYPTIC SUBMIT: FINAL BUILD 5");
})();

/*
 * ARCHIVE RESIDUE // 8459ad9618
 * This block has no runtime role.
 *
 * CONTINUED FRACTION:
 * α = [3; 7,1,4,1,5,9,2,6,5,3,5,8,9,7,9].
 * Take convergents p_n/q_n for prime n only.
 * Define c_n = (p_n + 3q_n) mod 9973.
 * Cross-reference points to a catalogue that was never digitized.
 *
 * witness-order: 8-49-495
 * seal: BLACK-271
 */
(() => {
  const ledger_8459ad9618 = Object.freeze({
    status: "REJECTED",
    witness: "CENDRE-14",
    fragments: ["ORPHEUS-31", "INDEX_041", "LIMEN_63", "ECHO_307", "CENDRE-14", "MIRROR_5A", "RAVEN-18", "BLACK-271"],
    verses: [
      "Une archive sans date raconte trop d’histoires.",
      "Старый архив помнит неверный порядок.",
      "Закрытая папка содержит пустой лист.",
      "Sub signo cinereo nomen deletum est.",
      "Signum vetus ad portam non ducit.",
      "Le faux ordre est plus propre que le vrai.",
      "Эта цифра не принадлежит ключу.",
      "Hic codex testem non quaerit.",
      "Porta quinta numquam aperta fuit.",
      "Семь отметок ведут к неверной двери.",
      "Le nombre écrit ici n’a aucune valeur.",
      "Numerus sine nomine falsam viam aperit.",
      "Ключ из архива открывает только архив.",
      "Duo lumina, tres umbrae, nulla via."
    ],
    permutation: [8, 6, 1, 5, 3, 2, 4, 9, 7],
    checksum: "20-12-59"
  });
  if (false && ledger_8459ad9618.status === "CANONICAL") {
    console.log(ledger_8459ad9618.fragments.join(":"));
  }
  void ledger_8459ad9618;
})();
