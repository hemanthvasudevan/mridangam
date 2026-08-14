/* Order history page: lists all orders for the logged-in user
   (or guest orders on this browser), each with a line-item summary. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("orders-root");
    var orders = window.MridangamShop.getOrdersForCurrentUser().slice().reverse();

    if (orders.length === 0) {
      root.innerHTML =
        '<div class="empty-state"><div class="icon">📦</div><h3>No orders yet</h3><p>Your placed orders will show up here.</p><a class="btn" href="shop.html">Go to Shop</a></div>';
    } else {
      root.innerHTML = orders
        .map(function (o) {
          var itemsLine = o.items.map(function (i) { return i.name + " × " + i.qty; }).join(", ");
          return (
            '<div class="order-history-card">' +
            '<div class="order-head">' +
            '<span class="order-id">Order #' + o.orderId + "</span>" +
            '<span class="status-pill">' + o.status + "</span>" +
            "</div>" +
            '<div class="order-date">' + new Date(o.date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) + "</div>" +
            "<p style=\"margin:10px 0 6px;font-size:.9rem;\">" + itemsLine + "</p>" +
            '<p style="margin:0;font-weight:600;color:var(--wood-dark);">Total: ' + window.MridangamShop.formatPrice(o.total) + "</p>" +
            "</div>"
          );
        })
        .join("");
    }

    window.MridangamShop.pushDL({
      event: "orderHistoryView",
      eventType: "account.orderHistoryViews",
      orderCount: orders.length
    });
  });
})();
