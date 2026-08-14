/* Login/registration page: tab switching plus login and register
   form handling. Redirects to My Account on success. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var tabLogin = document.getElementById("tab-login");
    var tabRegister = document.getElementById("tab-register");
    var panelLogin = document.getElementById("panel-login");
    var panelRegister = document.getElementById("panel-register");

    // If already logged in, send straight to the account page.
    if (window.MridangamShop.getCurrentUser()) {
      window.location.href = "account.html";
      return;
    }

    tabLogin.addEventListener("click", function () {
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      panelLogin.hidden = false;
      panelRegister.hidden = true;
    });
    tabRegister.addEventListener("click", function () {
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      panelRegister.hidden = false;
      panelLogin.hidden = true;
    });

    document.getElementById("login-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("login-email").value.trim();
      var password = document.getElementById("login-password").value;
      var result = window.MridangamShop.loginUser(email, password);
      var msg = document.getElementById("login-message");
      if (!result.ok) {
        msg.innerHTML = '<div class="form-error">' + result.error + "</div>";
        return;
      }
      msg.innerHTML = '<div class="form-success">Welcome back, ' + result.user.name + '! Redirecting…</div>';
      setTimeout(function () { window.location.href = "account.html"; }, 700);
    });

    document.getElementById("register-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("register-name").value.trim();
      var email = document.getElementById("register-email").value.trim();
      var password = document.getElementById("register-password").value;
      var result = window.MridangamShop.registerUser({ name: name, email: email, password: password });
      var msg = document.getElementById("register-message");
      if (!result.ok) {
        msg.innerHTML = '<div class="form-error">' + result.error + "</div>";
        return;
      }
      msg.innerHTML = '<div class="form-success">Account created! Redirecting…</div>';
      setTimeout(function () { window.location.href = "account.html"; }, 700);
    });
  });
})();
