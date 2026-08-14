/* My Account page: guards the page behind login, shows profile
   details and the 3 most recent orders, and handles logout. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var user = window.MridangamShop.getCurrentUser();
    var guard = document.getElementById("account-guard");
    var layout = document.getElementById("account-layout");

    if (!user) {
      guard.hidden = false;
      layout.hidden = true;
      return;
    }

    guard.hidden = true;
    layout.hidden = false;

    document.getElementById("profile-name").value = user.name;
    document.getElementById("profile-email").value = user.email;
    document.getElementById("profile-since").value = new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

    var orders = window.MridangamShop.getOrdersForCurrentUser().slice().reverse().slice(0, 3);
    var recentContainer = document.getElementById("recent-orders");
    if (orders.length === 0) {
      recentContainer.innerHTML = "<p>No orders yet. <a href=\"shop.html\">Start shopping →</a></p>";
    } else {
      recentContainer.innerHTML = orders
        .map(function (o) {
          return (
            '<div class="order-history-card">' +
            '<div class="order-head"><span class="order-id">#' + o.orderId + "</span>" +
            '<span class="status-pill">' + o.status + "</span></div>" +
            '<div class="order-date">' + new Date(o.date).toLocaleDateString("en-IN") + " · " + o.items.length + " item(s) · " + window.MridangamShop.formatPrice(o.total) + "</div>" +
            "</div>"
          );
        })
        .join("");
    }

    document.getElementById("logout-link").addEventListener("click", function (e) {
      e.preventDefault();
      window.MridangamShop.logoutUser();
      window.location.href = "login.html";
    });

    if (window.adobeDataLayer && window.adobeDataLayer[0]) {
      window.adobeDataLayer[0].userId = user.id;
    }
    window.MridangamShop.pushDL({
      event: "accountView",
      eventType: "account.views",
      user: { id: user.id, name: user.name },
      orderCount: window.MridangamShop.getOrdersForCurrentUser().length
    });
  });
})();
