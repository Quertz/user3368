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
