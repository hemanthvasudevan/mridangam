/* Product detail page: reads ?id= from the URL, renders the product,
   handles color selection, quantity, add-to-cart, reviews, and
   patches the initial pageview object with the viewed product. */
(function () {
  "use strict";

  function starString(rating) {
    var full = Math.round(rating);
    var stars = "";
    for (var i = 0; i < 5; i++) stars += i < full ? "★" : "☆";
    return stars;
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var selectedColor = "";
  var qty = 1;

  function renderReviews(productId) {
    var reviews = window.MridangamShop.getReviews(productId);
    var summary = window.MridangamShop.getRatingSummary(productId);
    var heading = document.getElementById("reviews-heading");
    if (heading) heading.textContent = "Reviews (" + summary.count + ")";

    var list = document.getElementById("reviews-list");
    if (!list) return;
    if (reviews.length === 0) {
      list.innerHTML = "<p>No reviews yet — be the first to share your experience.</p>";
      return;
    }
    list.innerHTML = reviews
      .slice()
      .reverse()
      .map(function (r) {
        return (
          '<div class="review-card">' +
          '<div class="review-head">' +
          '<span class="author">' + escapeHtml(r.author) + "</span>" +
          '<span class="stars">' + starString(r.rating) + "</span>" +
          '<span class="date">' + escapeHtml(r.date) + "</span>" +
          (r.verified ? '<span class="verified-badge">Verified Purchase</span>' : "") +
          "</div>" +
          "<h4>" + escapeHtml(r.title) + "</h4>" +
          "<p>" + escapeHtml(r.text) + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderRelated(product) {
    var container = document.getElementById("related-products");
    if (!container) return;
    var all = window.MridangamShop.getAllProducts();
    var related = all.filter(function (p) { return p.category === product.category && p.id !== product.id; }).slice(0, 3);
    container.innerHTML = related
      .map(function (p) {
        var summary = window.MridangamShop.getRatingSummary(p.id);
        return (
          '<a class="product-card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
          '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
          '<div class="body">' +
          '<span class="cat-tag">' + (p.category === "mridangam" ? "Mridangam" : "Parts &amp; Accessories") + "</span>" +
          "<h3>" + escapeHtml(p.name) + "</h3>" +
          '<div class="rating-line"><span class="stars">' + starString(summary.average) + '</span><span class="count">(' + summary.count + ")</span></div>" +
          '<span class="price">' + window.MridangamShop.formatPrice(p.price) + "</span>" +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderProduct(product) {
    document.getElementById("doc-title").textContent = product.name + " | The Mridangam Project";
    document.getElementById("breadcrumb-category").textContent = product.category === "mridangam" ? "Mridangams" : "Parts & Accessories";

    selectedColor = (product.colors && product.colors[0]) || "";
    qty = 1;

    var summary = window.MridangamShop.getRatingSummary(product.id);

    var colorHtml = "";
    if (product.colors && product.colors.length) {
      colorHtml =
        '<div class="color-picker"><span class="label">Colour</span><div class="color-options" id="color-options">' +
        product.colors
          .map(function (c, i) {
            return '<button type="button" class="color-option' + (i === 0 ? " selected" : "") + '" data-color="' + escapeHtml(c) + '">' + escapeHtml(c) + "</button>";
          })
          .join("") +
        "</div></div>";
    }

    var root = document.getElementById("product-detail-root");
    root.innerHTML =
      '<figure><img src="' + product.image + '" alt="' + escapeHtml(product.name) + '"></figure>' +
      "<div>" +
      '<span class="eyebrow">' + (product.category === "mridangam" ? "Mridangam" : "Parts & Accessories") + " · SKU " + escapeHtml(product.sku) + "</span>" +
      "<h1>" + escapeHtml(product.name) + "</h1>" +
      '<div class="rating-line" style="margin:8px 0;"><span class="stars">' + starString(summary.average) + '</span><span>' + summary.average + '</span><span class="count">(' + summary.count + " reviews)</span></div>" +
      '<div class="product-price">' + window.MridangamShop.formatPrice(product.price) + "</div>" +
      '<span class="stock-flag">' + (product.inStock ? "In Stock" : "Out of Stock") + "</span>" +
      "<p>" + escapeHtml(product.description) + "</p>" +
      colorHtml +
      '<div class="add-to-cart-row">' +
      '<div class="qty-stepper"><button type="button" id="qty-minus" aria-label="Decrease quantity">−</button><input type="text" id="qty-input" value="1" readonly><button type="button" id="qty-plus" aria-label="Increase quantity">+</button></div>' +
      '<button class="btn" id="add-to-cart-btn" type="button">Add to Cart</button>' +
      "</div>" +
      "</div>";

    // color selection
    var colorButtons = root.querySelectorAll(".color-option");
    colorButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        colorButtons.forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        selectedColor = btn.getAttribute("data-color");
      });
    });

    // quantity stepper
    var qtyInput = document.getElementById("qty-input");
    document.getElementById("qty-minus").addEventListener("click", function () {
      qty = Math.max(1, qty - 1);
      qtyInput.value = qty;
    });
    document.getElementById("qty-plus").addEventListener("click", function () {
      qty = qty + 1;
      qtyInput.value = qty;
    });

    // add to cart
    document.getElementById("add-to-cart-btn").addEventListener("click", function () {
      window.MridangamShop.addToCart(product, selectedColor, qty);
      var btn = document.getElementById("add-to-cart-btn");
      var original = btn.textContent;
      btn.textContent = "Added ✓";
      setTimeout(function () { btn.textContent = original; }, 1400);
    });

    renderReviews(product.id);
    renderRelated(product);

    // patch the initial pageview push with the viewed product, and fire a productView event
    if (window.adobeDataLayer && window.adobeDataLayer[0]) {
      window.adobeDataLayer[0].pageName = "product-" + product.id;
      window.adobeDataLayer[0].product = { id: product.id, name: product.name, sku: product.sku, category: product.category, price: product.price };
    }
    window.MridangamShop.pushDL({
      event: "productView",
      eventType: "commerce.productViews",
      product: { id: product.id, name: product.name, sku: product.sku, category: product.category, price: product.price },
      ratingAverage: summary.average,
      ratingCount: summary.count
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    var product = id ? window.MridangamShop.getProductById(id) : null;

    if (!product) {
      document.getElementById("product-detail-root").innerHTML =
        '<div class="note-box">We couldn\u2019t find that product. <a href="shop.html">Browse the full shop \u2192</a></div>';
      return;
    }

    renderProduct(product);

    var reviewForm = document.getElementById("review-form");
    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("review-name").value.trim();
      var rating = document.getElementById("review-rating").value;
      var title = document.getElementById("review-title").value.trim();
      var text = document.getElementById("review-text").value.trim();
      if (!name || !title || !text) return;

      window.MridangamShop.addReview(product.id, { author: name, rating: rating, title: title, text: text });
      document.getElementById("review-form-message").innerHTML = '<div class="form-success">Thanks — your review has been posted below.</div>';
      reviewForm.reset();
      renderReviews(product.id);

      // refresh just the rating summary shown near the price, without
      // re-rendering the whole product (that would re-fire productView)
      var updated = window.MridangamShop.getRatingSummary(product.id);
      var ratingLine = document.querySelector("#product-detail-root .rating-line");
      if (ratingLine) {
        ratingLine.innerHTML =
          '<span class="stars">' + starString(updated.average) + "</span><span>" + updated.average + '</span><span class="count">(' + updated.count + " reviews)</span>";
      }
    });
  });
})();
