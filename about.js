/* About/Contact page: the contact form is a front-end-only demo
   (no backend to send to), but it still confirms submission to the
   user and records a contactFormSubmit event in the data layer. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var subject = document.getElementById("contact-subject").value;
      var message = document.getElementById("contact-message");

      message.innerHTML = '<div class="form-success">Thanks for reaching out — this is a demo form, so no message was actually sent, but in production this would reach our support team.</div>';
      form.reset();

      window.MridangamShop.pushDL({
        event: "contactFormSubmit",
        eventType: "content.contactFormSubmits",
        subject: subject
      });
    });
  });
})();
