/* Checkout page: shows an order summary next to the shipping/payment
   form, pushes a checkoutStep event on load, and on submit places the
   order (which itself pushes a commerce.purchases event) before
   redirecting to the confirmation page. */
(function () {
  "use strict";

  function renderSummary() {
    var cart = window.MridangamShop.getCart();
    var form = document.getElementById("checkout-form");
    var emptyState = document.getElementById("checkout-empty");

    if (cart.length === 0) {
      form.hidden = true;
      document.getElementById("checkout-summary").hidden = true;
      emptyState.hidden = false;
      return false;
    }

    var itemsContainer = document.getElementById("checkout-summary-items");
    itemsContainer.innerHTML = cart
      .map(function (item) {
        return (
          '<div class="row"><span>' + item.name + (item.color ? " (" + item.color + ")" : "") + " × " + item.qty + "</span>" +
          "<span>" + window.MridangamShop.formatPrice(item.price * item.qty) + "</span></div>"
        );
      })
      .join("");

    var subtotal = window.MridangamShop.cartSubtotal(cart);
    var shipping = subtotal > 5000 ? 0 : 150;
    var tax = Math.round(subtotal * 0.05);
    var total = subtotal + shipping + tax;

    document.getElementById("checkout-subtotal").textContent = window.MridangamShop.formatPrice(subtotal);
    document.getElementById("checkout-shipping").textContent = shipping === 0 ? "Free" : window.MridangamShop.formatPrice(shipping);
    document.getElementById("checkout-tax").textContent = window.MridangamShop.formatPrice(tax);
    document.getElementById("checkout-total").textContent = window.MridangamShop.formatPrice(total);
    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var hasItems = renderSummary();

    window.MridangamShop.pushDL({
      event: "checkoutStep",
      eventType: "commerce.checkouts",
      step: "shipping_payment",
      cart: {
        items: window.MridangamShop.getCart().map(function (i) { return { id: i.productId, name: i.name, price: i.price, color: i.color, quantity: i.qty }; }),
        itemCount: window.MridangamShop.cartItemCount(),
        subtotal: window.MridangamShop.cartSubtotal()
      }
    });

    if (!hasItems) return;

    document.getElementById("checkout-form").addEventListener("submit", function (e) {
      e.preventDefault();

      var shippingAddress = {
        name: document.getElementById("full-name").value.trim(),
        address: document.getElementById("address-line").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        pincode: document.getElementById("pincode").value.trim(),
        phone: document.getElementById("phone").value.trim()
      };
      var paymentMethod = document.getElementById("payment-method").value;

      var order = window.MridangamShop.placeOrder({ shippingAddress: shippingAddress, paymentMethod: paymentMethod });
      window.location.href = "order-confirmation.html?order=" + encodeURIComponent(order.orderId);
    });
  });
})();
