/* Cart page: renders line items from localStorage, lets the user
   change quantity or remove a line, and pushes a cartView event. */
(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    var cart = window.MridangamShop.getCart();
    var tbody = document.getElementById("cart-table-body");
    var table = document.getElementById("cart-table");
    var emptyState = document.getElementById("cart-empty-state");
    var summary = document.getElementById("cart-summary");

    if (cart.length === 0) {
      table.hidden = true;
      summary.hidden = true;
      emptyState.hidden = false;
      window.MridangamShop.pushDL({
        event: "cartView",
        eventType: "commerce.cartViews",
        cart: { items: [], itemCount: 0, subtotal: 0 }
      });
      return;
    }

    table.hidden = false;
    summary.hidden = false;
    emptyState.hidden = true;

    tbody.innerHTML = cart
      .map(function (item) {
        var lineTotal = item.price * item.qty;
        return (
          "<tr>" +
          "<td><div class=\"cart-line-product\"><img src=\"" + item.image + "\" alt=\"" + escapeHtml(item.name) + "\">" +
          "<div><div class=\"name\">" + escapeHtml(item.name) + "</div>" +
          (item.color ? '<div class="color">Colour: ' + escapeHtml(item.color) + "</div>" : "") +
          "</div></div></td>" +
          "<td>" + window.MridangamShop.formatPrice(item.price) + "</td>" +
          '<td><div class="qty-stepper">' +
          '<button type="button" class="qty-dec" data-id="' + item.productId + '" data-color="' + escapeHtml(item.color) + '" aria-label="Decrease quantity">−</button>' +
          '<input type="text" readonly value="' + item.qty + '">' +
          '<button type="button" class="qty-inc" data-id="' + item.productId + '" data-color="' + escapeHtml(item.color) + '" aria-label="Increase quantity">+</button>' +
          "</div></td>" +
          "<td>" + window.MridangamShop.formatPrice(lineTotal) + "</td>" +
          '<td><button type="button" class="cart-remove-btn" data-id="' + item.productId + '" data-color="' + escapeHtml(item.color) + '">Remove</button></td>' +
          "</tr>"
        );
      })
      .join("");

    var subtotal = window.MridangamShop.cartSubtotal(cart);
    var shipping = subtotal > 5000 ? 0 : 150;
    var tax = Math.round(subtotal * 0.05);
    var total = subtotal + shipping + tax;

    document.getElementById("summary-subtotal").textContent = window.MridangamShop.formatPrice(subtotal);
    document.getElementById("summary-shipping").textContent = shipping === 0 ? "Free" : window.MridangamShop.formatPrice(shipping);
    document.getElementById("summary-tax").textContent = window.MridangamShop.formatPrice(tax);
    document.getElementById("summary-total").textContent = window.MridangamShop.formatPrice(total);

    attachRowHandlers();

    window.MridangamShop.pushDL({
      event: "cartView",
      eventType: "commerce.cartViews",
      cart: {
        items: cart.map(function (i) { return { id: i.productId, name: i.name, price: i.price, color: i.color, quantity: i.qty }; }),
        itemCount: window.MridangamShop.cartItemCount(cart),
        subtotal: subtotal
      }
    });
  }

  function attachRowHandlers() {
    document.querySelectorAll(".qty-inc").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cart = window.MridangamShop.getCart();
        var id = btn.getAttribute("data-id");
        var color = btn.getAttribute("data-color");
        var line = cart.filter(function (i) { return i.productId === id && i.color === color; })[0];
        if (line) window.MridangamShop.updateCartQty(id, color, line.qty + 1);
        render();
      });
    });
    document.querySelectorAll(".qty-dec").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cart = window.MridangamShop.getCart();
        var id = btn.getAttribute("data-id");
        var color = btn.getAttribute("data-color");
        var line = cart.filter(function (i) { return i.productId === id && i.color === color; })[0];
        if (line) window.MridangamShop.updateCartQty(id, color, line.qty - 1);
        render();
      });
    });
    document.querySelectorAll(".cart-remove-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.MridangamShop.removeFromCart(btn.getAttribute("data-id"), btn.getAttribute("data-color"));
        render();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", render);
})();
