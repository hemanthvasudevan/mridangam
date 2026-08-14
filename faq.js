/* FAQ page: pushes a dataLayer event whenever a visitor opens a
   question, so the most-viewed FAQs can be identified in reporting. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        var question = item.querySelector("summary").textContent.trim();
        window.MridangamShop.pushDL({
          event: "faqExpand",
          eventType: "content.faqExpands",
          question: question
        });
      });
    });
  });
})();
