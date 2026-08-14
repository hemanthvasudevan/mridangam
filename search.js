/* =========================================================
   MRIDANGAM SITE — INTERNAL SEARCH
   Powers the search box in the nav on every page, the
   suggestions dropdown, and the dedicated search.html
   results page. Pushes search activity into adobeDataLayer.
   ========================================================= */
(function () {
  "use strict";

  function getIndex() {
    return window.mridangamSearchIndex || [];
  }

  function runSearch(term) {
    var termLower = (term || "").trim().toLowerCase();
    if (!termLower) return [];
    return getIndex().filter(function (item) {
      var haystack = (item.title + " " + item.snippet + " " + item.keywords).toLowerCase();
      return haystack.indexOf(termLower) !== -1;
    });
  }

  // Push a dedicated search event, and patch the current page's
  // pageview object (index 0) so pageName-level reporting also
  // reflects the last search term run on that page load.
  function recordSearch(term, resultsCount) {
    window.adobeDataLayer = window.adobeDataLayer || [];
    if (window.adobeDataLayer[0]) {
      window.adobeDataLayer[0].searchTerm = term;
      window.adobeDataLayer[0].searchResultsCount = resultsCount;
    }
    window.adobeDataLayer.push({
      event: "search",
      eventType: "search",
      searchTerm: term,
      searchResultsCount: resultsCount,
      pageName: window.adobeDataLayer[0] ? window.adobeDataLayer[0].pageName : undefined
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function initNavSearch() {
    var forms = document.querySelectorAll("[data-site-search-form]");
    forms.forEach(function (form) {
      var input = form.querySelector('input[type="search"]');
      var suggestionsBox = form.querySelector(".search-suggestions");
      if (!input) return;

      function renderSuggestions(term) {
        if (!suggestionsBox) return;
        var results = runSearch(term).slice(0, 5);
        if (!term.trim() || results.length === 0) {
          suggestionsBox.innerHTML = "";
          suggestionsBox.hidden = true;
          return;
        }
        suggestionsBox.innerHTML = results
          .map(function (r) {
            return (
              '<a class="search-suggestion" href="' + r.page + "?q=" + encodeURIComponent(term) + '">' +
              '<span class="s-title">' + escapeHtml(r.title) + "</span>" +
              '<span class="s-section">' + escapeHtml(r.section) + "</span>" +
              "</a>"
            );
          })
          .join("");
        suggestionsBox.hidden = false;
      }

      input.addEventListener("input", function () {
        renderSuggestions(input.value);
      });
      input.addEventListener("focus", function () {
        if (input.value) renderSuggestions(input.value);
      });
      document.addEventListener("click", function (e) {
        if (suggestionsBox && !form.contains(e.target)) {
          suggestionsBox.hidden = true;
        }
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var term = input.value.trim();
        if (!term) return;
        var results = runSearch(term);
        recordSearch(term, results.length);
        window.location.href = "search.html?q=" + encodeURIComponent(term);
      });
    });
  }

  function initSearchResultsPage() {
    if (document.body.getAttribute("data-page") !== "search") return;

    var params = new URLSearchParams(window.location.search);
    var initialTerm = params.get("q") || "";

    var pageForm = document.getElementById("search-page-form");
    var pageInput = document.getElementById("search-page-input");
    var resultsContainer = document.getElementById("search-results");
    var termDisplay = document.getElementById("search-term-display");
    var countDisplay = document.getElementById("search-result-count");

    function renderResults(term) {
      var results = runSearch(term);

      if (termDisplay) termDisplay.textContent = term ? '"' + term + '"' : "";
      if (countDisplay) countDisplay.textContent = String(results.length);

      if (resultsContainer) {
        if (!term.trim()) {
          resultsContainer.innerHTML = "<p>Type a search term above to look across the site — try \u201csyahi\u201d, \u201cPalghat Mani Iyer\u201d, or \u201cThanjavur\u201d.</p>";
        } else if (results.length === 0) {
          resultsContainer.innerHTML =
            '<div class="note-box">No pages matched <strong>"' + escapeHtml(term) + '"</strong>. Try a different term, or browse the six sections from the menu above.</div>';
        } else {
          resultsContainer.innerHTML = results
            .map(function (r) {
              return (
                '<a class="search-result-card" href="' + r.page + '">' +
                '<span class="loc">' + escapeHtml(r.section) + "</span>" +
                "<h3>" + escapeHtml(r.title) + "</h3>" +
                "<p>" + escapeHtml(r.snippet) + "</p>" +
                "</a>"
              );
            })
            .join("");
        }
      }

      recordSearch(term, results.length);
    }

    if (pageInput) pageInput.value = initialTerm;
    renderResults(initialTerm);

    if (pageForm) {
      pageForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var term = pageInput ? pageInput.value.trim() : "";
        var url = new URL(window.location.href);
        if (term) {
          url.searchParams.set("q", term);
        } else {
          url.searchParams.delete("q");
        }
        window.history.replaceState({}, "", url);
        renderResults(term);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavSearch();
    initSearchResultsPage();
  });
})();
