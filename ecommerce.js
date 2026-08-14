/* =========================================================
   MRIDANGAM SITE — E-COMMERCE CORE
   Client-side cart, account, order, and review handling
   using localStorage (this is a static demo site with no
   backend). Every commerce action also pushes a matching
   event into window.adobeDataLayer.

   NOTE: This is a front-end prototype only. Passwords are
   stored in plain text in the browser's localStorage for
   demo purposes and must never be used as a real auth
   system in production.
   ========================================================= */
(function (global) {
  "use strict";

  var LS_CART = "mridangam_cart";
  var LS_USERS = "mridangam_users";
  var LS_SESSION = "mridangam_session";
  var LS_ORDERS = "mridangam_orders";
  var LS_EXTRA_REVIEWS = "mridangam_extra_reviews";

  /* ---------- low-level storage helpers ---------- */
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable — fail silently in this demo */
    }
  }

  /* ---------- dataLayer helper ---------- */
  function pushDL(eventObj) {
    global.adobeDataLayer = global.adobeDataLayer || [];
    global.adobeDataLayer.push(eventObj);
  }

  function formatPrice(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  /* ---------- product lookup ---------- */
  function getAllProducts() {
    return global.mridangamProducts || [];
  }
  function getProductById(id) {
    return getAllProducts().filter(function (p) { return p.id === id; })[0] || null;
  }

  /* ---------- reviews (static + user-submitted, merged) ---------- */
  function getExtraReviews(productId) {
    var all = readJSON(LS_EXTRA_REVIEWS, {});
    return all[productId] || [];
  }
  function getReviews(productId) {
    var product = getProductById(productId);
    var staticReviews = product ? product.reviews || [] : [];
    return staticReviews.concat(getExtraReviews(productId));
  }
  function getRatingSummary(productId) {
    var reviews = getReviews(productId);
    var product = getProductById(productId);
    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }
    var sum = reviews.reduce(function (acc, r) { return acc + Number(r.rating); }, 0);
    return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
  }
  function addReview(productId, review) {
    var all = readJSON(LS_EXTRA_REVIEWS, {});
    all[productId] = all[productId] || [];
    var entry = {
      author: review.author || "Guest",
      rating: Number(review.rating),
      date: new Date().toISOString().slice(0, 10),
      title: review.title || "",
      text: review.text || "",
      verified: false
    };
    all[productId].push(entry);
    writeJSON(LS_EXTRA_REVIEWS, all);

    var summary = getRatingSummary(productId);
    pushDL({
      event: "productReview",
      eventType: "commerce.productReviews",
      product: { id: productId, name: (getProductById(productId) || {}).name },
      review: { rating: entry.rating, title: entry.title },
      ratingAverage: summary.average,
      ratingCount: summary.count
    });
    return entry;
  }

  /* ---------- cart ---------- */
  function getCart() {
    return readJSON(LS_CART, []);
  }
  function saveCart(cart) {
    writeJSON(LS_CART, cart);
    renderCartBadge();
  }
  function cartLineKey(productId, color) {
    return productId + "::" + (color || "");
  }
  function cartItemCount(cart) {
    cart = cart || getCart();
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }
  function cartSubtotal(cart) {
    cart = cart || getCart();
    return cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  }
  function cartToDLItems(cart) {
    cart = cart || getCart();
    return cart.map(function (item) {
      return { id: item.productId, name: item.name, price: item.price, color: item.color, quantity: item.qty };
    });
  }
  function addToCart(product, color, qty) {
    qty = qty || 1;
    var cart = getCart();
    var key = cartLineKey(product.id, color);
    var existing = cart.filter(function (i) { return cartLineKey(i.productId, i.color) === key; })[0];
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ productId: product.id, name: product.name, price: product.price, color: color || "", image: product.image, qty: qty });
    }
    saveCart(cart);

    pushDL({
      event: "addToCart",
      eventType: "commerce.productListAdds",
      product: { id: product.id, name: product.name, sku: product.sku, category: product.category, price: product.price, color: color || "" },
      quantity: qty,
      cart: { items: cartToDLItems(cart), itemCount: cartItemCount(cart), subtotal: cartSubtotal(cart) }
    });
  }
  function updateCartQty(productId, color, qty) {
    var cart = getCart();
    var key = cartLineKey(productId, color);
    cart = cart.map(function (item) {
      if (cartLineKey(item.productId, item.color) === key) item.qty = Math.max(1, qty);
      return item;
    });
    saveCart(cart);
    pushDL({
      event: "cartUpdate",
      eventType: "commerce.cartUpdates",
      cart: { items: cartToDLItems(cart), itemCount: cartItemCount(cart), subtotal: cartSubtotal(cart) }
    });
  }
  function removeFromCart(productId, color) {
    var cart = getCart();
    var key = cartLineKey(productId, color);
    var removed = cart.filter(function (i) { return cartLineKey(i.productId, i.color) === key; })[0];
    cart = cart.filter(function (i) { return cartLineKey(i.productId, i.color) !== key; });
    saveCart(cart);
    pushDL({
      event: "removeFromCart",
      eventType: "commerce.productListRemovals",
      product: removed ? { id: removed.productId, name: removed.name, color: removed.color } : null,
      cart: { items: cartToDLItems(cart), itemCount: cartItemCount(cart), subtotal: cartSubtotal(cart) }
    });
  }
  function clearCart() {
    saveCart([]);
  }
  function renderCartBadge() {
    var badges = document.querySelectorAll("[data-cart-badge]");
    var count = cartItemCount();
    badges.forEach(function (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  }

  /* ---------- accounts (demo-only, plain-text localStorage) ---------- */
  function getUsers() {
    return readJSON(LS_USERS, []);
  }
  function saveUsers(users) {
    writeJSON(LS_USERS, users);
  }
  function getCurrentUser() {
    var session = readJSON(LS_SESSION, null);
    if (!session) return null;
    return getUsers().filter(function (u) { return u.id === session.userId; })[0] || null;
  }
  function registerUser(data) {
    var users = getUsers();
    if (users.some(function (u) { return u.email.toLowerCase() === data.email.toLowerCase(); })) {
      return { ok: false, error: "An account with this email already exists." };
    }
    var user = {
      id: "usr_" + Date.now(),
      name: data.name,
      email: data.email,
      password: data.password, // demo only — never store real passwords like this
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    writeJSON(LS_SESSION, { userId: user.id });
    pushDL({
      event: "registration",
      eventType: "account.registrations",
      user: { id: user.id, name: user.name }
    });
    updateAccountNavLink();
    return { ok: true, user: user };
  }
  function loginUser(email, password) {
    var user = getUsers().filter(function (u) {
      return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
    })[0];
    if (!user) return { ok: false, error: "Email or password is incorrect." };
    writeJSON(LS_SESSION, { userId: user.id });
    pushDL({
      event: "login",
      eventType: "account.logins",
      user: { id: user.id, name: user.name }
    });
    updateAccountNavLink();
    return { ok: true, user: user };
  }
  function logoutUser() {
    var user = getCurrentUser();
    localStorage.removeItem(LS_SESSION);
    pushDL({
      event: "logout",
      eventType: "account.logouts",
      user: user ? { id: user.id, name: user.name } : null
    });
    updateAccountNavLink();
  }
  function updateAccountNavLink() {
    var link = document.querySelector("[data-account-nav-link]");
    if (!link) return;
    var user = getCurrentUser();
    if (user) {
      link.setAttribute("href", "account.html");
      link.setAttribute("aria-label", "My Account (" + user.name + ")");
      link.title = "My Account (" + user.name + ")";
    } else {
      link.setAttribute("href", "login.html");
      link.setAttribute("aria-label", "Login or Register");
      link.title = "Login or Register";
    }
  }

  /* ---------- orders ---------- */
  function getOrders() {
    return readJSON(LS_ORDERS, []);
  }
  function getOrdersForCurrentUser() {
    var user = getCurrentUser();
    var all = getOrders();
    if (user) return all.filter(function (o) { return o.userId === user.id; });
    return all.filter(function (o) { return o.userId === "guest"; });
  }
  function placeOrder(details) {
    var cart = getCart();
    var user = getCurrentUser();
    var subtotal = cartSubtotal(cart);
    var shipping = subtotal > 5000 || cart.length === 0 ? 0 : 150;
    var tax = Math.round(subtotal * 0.05);
    var total = subtotal + shipping + tax;
    var order = {
      orderId: "MRD" + Date.now().toString().slice(-8),
      userId: user ? user.id : "guest",
      items: cart,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      total: total,
      shippingAddress: details.shippingAddress,
      paymentMethod: details.paymentMethod,
      date: new Date().toISOString(),
      status: "Confirmed"
    };
    var orders = getOrders();
    orders.push(order);
    writeJSON(LS_ORDERS, orders);
    clearCart();

    pushDL({
      event: "purchase",
      eventType: "commerce.purchases",
      order: {
        orderId: order.orderId,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        itemCount: cartItemCount(cart)
      },
      product: cartToDLItems(cart)
    });

    return order;
  }
  function getOrderById(orderId) {
    return getOrders().filter(function (o) { return o.orderId === orderId; })[0] || null;
  }

  /* ---------- expose API ---------- */
  global.MridangamShop = {
    formatPrice: formatPrice,
    getAllProducts: getAllProducts,
    getProductById: getProductById,
    getReviews: getReviews,
    getRatingSummary: getRatingSummary,
    addReview: addReview,
    getCart: getCart,
    cartItemCount: cartItemCount,
    cartSubtotal: cartSubtotal,
    addToCart: addToCart,
    updateCartQty: updateCartQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    renderCartBadge: renderCartBadge,
    getCurrentUser: getCurrentUser,
    registerUser: registerUser,
    loginUser: loginUser,
    logoutUser: logoutUser,
    updateAccountNavLink: updateAccountNavLink,
    getOrders: getOrders,
    getOrdersForCurrentUser: getOrdersForCurrentUser,
    placeOrder: placeOrder,
    getOrderById: getOrderById,
    pushDL: pushDL
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderCartBadge();
    updateAccountNavLink();
  });
})(window);
