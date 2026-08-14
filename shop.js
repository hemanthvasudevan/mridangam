/* Shop category page: renders the product grid, handles filter/sort,
   and pushes commerce.productListViews events into the data layer. */
(function () {
  "use strict";

  function starString(rating) {
    var full = Math.round(rating);
    var stars = "";
    for (var i = 0; i < 5; i++) stars += i < full ? "★" : "☆";
    return stars;
  }

  function productCard(p) {
    var summary = window.MridangamShop.getRatingSummary(p.id);
    return (
      '<a class="product-card" href="product.html?id=' + encodeURIComponent(p.id) + '" data-product-id="' + p.id + '">' +
      '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
      '<div class="body">' +
      '<span class="cat-tag">' + (p.category === "mridangam" ? "Mridangam" : "Parts &amp; Accessories") + "</span>" +
      "<h3>" + p.name + "</h3>" +
      '<div class="rating-line"><span class="stars">' + starString(summary.average) + '</span><span class="count">(' + summary.count + ")</span></div>" +
      '<span class="price">' + window.MridangamShop.formatPrice(p.price) + "</span>" +
      "</div>" +
      "</a>"
    );
  }

  function getState() {
    var chips = document.querySelectorAll(".filter-chip");
    var active = document.querySelector(".filter-chip.active");
    var sortSelect = document.getElementById("sort-select");
    return {
      filter: active ? active.getAttribute("data-filter") : "all",
      sort: sortSelect ? sortSelect.value : "featured"
    };
  }

  function sortProducts(products, sort) {
    var copy = products.slice();
    if (sort === "price-asc") copy.sort(function (a, b) { return a.price - b.price; });
    if (sort === "price-desc") copy.sort(function (a, b) { return b.price - a.price; });
    if (sort === "rating-desc") copy.sort(function (a, b) { return b.rating - a.rating; });
    return copy;
  }

  function render() {
    var grid = document.getElementById("product-grid");
    if (!grid) return;
    var state = getState();
    var all = window.MridangamShop.getAllProducts();
    var filtered = state.filter === "all" ? all : all.filter(function (p) { return p.category === state.filter; });
    filtered = sortProducts(filtered, state.sort);

    grid.innerHTML = filtered.map(productCard).join("");

    window.MridangamShop.pushDL({
      event: "productListView",
      eventType: "commerce.productListViews",
      list: { filter: state.filter, sort: state.sort, itemCount: filtered.length },
      products: filtered.map(function (p) { return { id: p.id, name: p.name, price: p.price, category: p.category }; })
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var chips = document.querySelectorAll(".filter-chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        render();
      });
    });
    var sortSelect = document.getElementById("sort-select");
    if (sortSelect) sortSelect.addEventListener("change", render);

    render();
  });
})();
