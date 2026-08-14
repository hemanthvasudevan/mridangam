/* Order confirmation page: looks up the order by ?order= id and
   renders a summary. Patches the initial pageview push with the
   orderId so it's available to any Launch rule reading pageName data. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var orderId = params.get("order");
    var order = orderId ? window.MridangamShop.getOrderById(orderId) : null;
    var root = document.getElementById("confirmation-root");

    if (!order) {
      root.innerHTML =
        '<div class="note-box">We couldn\u2019t find that order. If you just placed one, check your <a href="orders.html">order history</a>, or <a href="shop.html">continue shopping</a>.</div>';
      return;
    }

    if (window.adobeDataLayer && window.adobeDataLayer[0]) {
      window.adobeDataLayer[0].orderId = order.orderId;
      window.adobeDataLayer[0].orderTotal = order.total;
    }

    var itemsHtml = order.items
      .map(function (item) {
        return (
          '<div class="row"><span>' + item.name + (item.color ? " (" + item.color + ")" : "") + " × " + item.qty + "</span>" +
          "<span>" + window.MridangamShop.formatPrice(item.price * item.qty) + "</span></div>"
        );
      })
      .join("");

    root.innerHTML =
      '<div class="confirmation-banner">' +
      '<div class="icon">✅</div>' +
      "<h1>Thank you — your order is confirmed!</h1>" +
      "<p>A confirmation has been recorded for this order. Keep the order number below for reference.</p>" +
      '<div class="order-id">Order #' + order.orderId + "</div>" +
      "</div>" +
      '<div class="two-col">' +
      '<div class="form-card wide">' +
      "<h3>Shipping to</h3>" +
      "<p>" + order.shippingAddress.name + "<br>" + order.shippingAddress.address + "<br>" +
      order.shippingAddress.city + ", " + order.shippingAddress.state + " " + order.shippingAddress.pincode + "<br>" +
      "Phone: " + order.shippingAddress.phone + "</p>" +
      "<h3>Payment Method</h3><p>" + order.paymentMethod.toUpperCase() + "</p>" +
      "<h3>Order Date</h3><p>" + new Date(order.date).toLocaleString("en-IN") + "</p>" +
      "</div>" +
      '<div class="order-summary">' +
      "<h3>Order Summary</h3>" + itemsHtml +
      '<div class="row"><span>Subtotal</span><span>' + window.MridangamShop.formatPrice(order.subtotal) + "</span></div>" +
      '<div class="row"><span>Shipping</span><span>' + (order.shipping === 0 ? "Free" : window.MridangamShop.formatPrice(order.shipping)) + "</span></div>" +
      '<div class="row"><span>Tax</span><span>' + window.MridangamShop.formatPrice(order.tax) + "</span></div>" +
      '<div class="row total"><span>Total</span><span>' + window.MridangamShop.formatPrice(order.total) + "</span></div>" +
      "</div>" +
      "</div>" +
      '<div class="btn-row" style="margin-top:28px;">' +
      '<a class="btn" href="shop.html">Continue Shopping</a>' +
      '<a class="btn secondary" href="orders.html">View Order History</a>' +
      "</div>";
  });
})();
