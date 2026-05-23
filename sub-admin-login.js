// South Diamond — sub-admin login handler.
// Tiny standalone script (no DOM assumptions beyond the login form).
// Replaces script.js on sub-admin-login.html so the page loads instantly
// and the submit handler always registers, even if other JS is broken.

(function () {
  const form = document.querySelector("[data-sub-admin-login-form]");
  if (!form) return;

  const usernameInput = form.querySelector("[data-sub-admin-username]");
  const passwordInput = form.querySelector("[data-sub-admin-password]");
  const submitButton = form.querySelector("[data-sub-admin-submit]");
  const errorEl = form.querySelector("[data-sub-admin-error]");

  function showError(text) {
    if (errorEl) {
      errorEl.style.color = "#ffb4b4";
      errorEl.textContent = text || "";
    }
  }

  function showInfo(text) {
    if (errorEl) {
      errorEl.style.color = "#7be4b0";
      errorEl.textContent = text || "";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");

    const username = (usernameInput && usernameInput.value || "").trim();
    const password = (passwordInput && passwordInput.value) || "";

    if (!username || !password) {
      showError("Enter your username and password.");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Signing in...";
    }

    try {
      const response = await fetch("/api/admin/sub-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (err) {
        payload = {};
      }

      if (!response.ok || !payload.ok) {
        showError(payload.error || ("Sign in failed (HTTP " + response.status + ")."));
        return;
      }

      showInfo("Signed in. Redirecting...");
      // Small delay so user sees the success state before navigation.
      window.location.assign("/admin");
    } catch (err) {
      showError("Could not reach the server. Check your connection and try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Log In";
      }
    }
  });
})();
