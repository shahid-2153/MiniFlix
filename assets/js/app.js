(() => {
  const ACCOUNT_KEY = "miniflixUser";
  const SESSION_KEY = "miniflixSession";
  const $ = id => document.getElementById(id);
  const root = document.body.dataset.root || ".";

  function bytesToBase64(bytes) {
    let text = "";
    bytes.forEach(byte => { text += String.fromCharCode(byte); });
    return btoa(text);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }

  async function hashPassword(password) {
    if (!crypto.subtle || !crypto.getRandomValues) {
      throw new Error("Password protection requires HTTPS or localhost and a modern browser.");
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iterations = 180000;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
    return { salt: bytesToBase64(salt), passwordHash: bytesToBase64(new Uint8Array(bits)), iterations };
  }

  async function verifyPassword(password, account) {
    if (!crypto.subtle || !account || !account.salt || !account.passwordHash) return false;
    const salt = base64ToBytes(account.salt);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({
      name: "PBKDF2", salt, iterations: Number(account.iterations) || 180000, hash: "SHA-256"
    }, key, 256);
    const actual = new Uint8Array(bits);
    const expected = base64ToBytes(account.passwordHash);
    if (actual.length !== expected.length) return false;
    let mismatch = 0;
    actual.forEach((value, index) => { mismatch |= value ^ expected[index]; });
    return mismatch === 0;
  }

  function readAccount() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); }
    catch { return null; }
  }

  function setSession(username, remember) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, username);
  }

  function getSession() {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "";
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function initLanding() {
    const form = $("reg-form");
    if (!form) return;
    form.addEventListener("submit", event => {
      event.preventDefault();
      const email = $("emailField").value.trim().toLowerCase();
      $("error").textContent = "";
      $("errorIcon").style.display = "none";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        $("error").textContent = "Please enter a valid email address.";
        $("errorIcon").style.display = "inline";
        return;
      }
      localStorage.setItem("userEmail", email);
      window.location.href = "Register.html";
    });
  }

  function initRegister() {
    const form = $("reg-form");
    if (!form) return;
    if (!localStorage.getItem("userEmail")) {
      window.location.replace("MiniFlix.html");
      return;
    }
    const showError = (id, message) => { $(id).textContent = message; };
    form.addEventListener("submit", async event => {
      event.preventDefault();
      ["user-error", "pswd-error", "cnfrm-pswd-error"].forEach(id => { $(id).textContent = ""; });
      const username = $("user").value.trim();
      const password = $("pswd").value;
      const confirmPassword = $("cnfrm-pswd").value;
      let valid = true;
      if (username.length < 3) {
        showError("user-error", "Username must contain at least 3 characters.");
        valid = false;
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
        showError("pswd-error", "Use 8+ characters with uppercase, lowercase, a number and a symbol.");
        valid = false;
      }
      if (password !== confirmPassword) {
        showError("cnfrm-pswd-error", "Passwords do not match.");
        valid = false;
      }
      if (!valid) return;

      const email = localStorage.getItem("userEmail").trim().toLowerCase();
      const existing = readAccount();
      if (existing) {
        showError("user-error", "A demo account already exists in this browser. Sign in instead.");
        return;
      }
      const oldUsername = localStorage.getItem("username") || "";
      if (localStorage.getItem("password")) {
        showError("user-error", "An older demo account exists in this browser. Sign in with that account first.");
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Creating account…";
      try {
        const passwordData = await hashPassword(password);
        const pendingUser = {
          username, email, ...passwordData, createdAt: new Date().toISOString(), verified: false
        };
        const random = crypto.getRandomValues(new Uint32Array(1))[0];
        const code = String(1000 + (random % 9000));
        sessionStorage.setItem("miniflixPendingUser", JSON.stringify(pendingUser));
        sessionStorage.setItem("miniflixPendingOtp", code);
        window.location.href = "OTP.html";
      } catch (error) {
        showError("pswd-error", error.message || "Could not create the demo account.");
        button.disabled = false;
        button.textContent = "Continue";
      }
    });
  }

  function initLogin() {
    const form = $("login-form");
    if (!form) return;
    const showError = (field, message) => {
      const messageId = field + "-error";
      const iconId = field + "-error-icon";
      $(messageId).textContent = message;
      $(iconId).style.display = "inline";
    };
    form.addEventListener("submit", async event => {
      event.preventDefault();
      $("username-error").textContent = "";
      $("password-error").textContent = "";
      $("username-error-icon").style.display = "none";
      $("password-error-icon").style.display = "none";
      const username = $("username").value.trim();
      const password = $("password").value;
      if (!username) showError("username", "Username is required.");
      if (!password) showError("password", "Password is required.");
      if (!username || !password) return;

      const button = $("login-btn");
      button.disabled = true;
      button.textContent = "Signing in…";
      try {
        let account = readAccount();
        let authenticated = false;
        if (account && account.username.toLowerCase() === username.toLowerCase() && account.verified) {
          authenticated = await verifyPassword(password, account);
        } else if (!account) {
          // Migrate an older demo account once; the plaintext password is removed after migration.
          const oldUsername = localStorage.getItem("username") || "";
          const oldPassword = localStorage.getItem("password");
          if (oldPassword && oldUsername.toLowerCase() === username.toLowerCase() && oldPassword === password) {
            account = {
              username: oldUsername,
              email: localStorage.getItem("userEmail") || "",
              ...(await hashPassword(password)),
              createdAt: new Date().toISOString(),
              verified: true
            };
            localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
            localStorage.removeItem("password");
            authenticated = true;
          }
        }
        if (!authenticated) {
          showError("password", "Invalid username or password. Check your details or create an account.");
          return;
        }
        setSession(account.username, $("remember-me").checked);
        window.location.href = "Home.html";
      } catch (error) {
        showError("password", error.message || "Sign-in failed. Please try again.");
      } finally {
        button.disabled = false;
        button.textContent = "Login";
      }
    });
    ["username", "password"].forEach(field => {
      $(field).addEventListener("input", () => {
        $(field + "-error").textContent = "";
        $(field + "-error-icon").style.display = "none";
      });
    });
  }

  function initOtp() {
    const inputs = $("inputs");
    if (!inputs) return;
    const fields = Array.from(inputs.querySelectorAll("input"));
    const message = $("otp-msg");
    const pending = (() => {
      try { return JSON.parse(sessionStorage.getItem("miniflixPendingUser") || "null"); }
      catch { return null; }
    })();
    const expectedCode = sessionStorage.getItem("miniflixPendingOtp");
    if (!pending || !expectedCode) {
      window.location.replace("Register.html");
      return;
    }
    message.textContent = "Demo verification for " + pending.email + ". No email is sent by this frontend-only project.";
    $("demo-code").textContent = "Demo code: " + expectedCode + " (testing only)";
    fields[0].focus();

    inputs.addEventListener("input", event => {
      const input = event.target;
      if (!input.matches("input")) return;
      input.value = input.value.replace(/\D/g, "").slice(-1);
      if (input.value) {
        const next = fields[fields.indexOf(input) + 1];
        if (next) next.focus();
      }
    });
    inputs.addEventListener("keydown", event => {
      const input = event.target;
      if (input.matches("input") && event.key === "Backspace" && !input.value) {
        const previous = fields[fields.indexOf(input) - 1];
        if (previous) previous.focus();
      }
    });
    inputs.addEventListener("paste", event => {
      const pasted = (event.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 4);
      if (!pasted) return;
      event.preventDefault();
      fields.forEach((field, index) => { field.value = pasted[index] || ""; });
      fields[Math.min(pasted.length, fields.length - 1)].focus();
    });
    $("done-btn").addEventListener("click", () => {
      const entered = fields.map(field => field.value).join("");
      if (entered.length !== 4) {
        message.textContent = "Enter all four digits.";
        message.style.color = "#d93025";
        return;
      }
      if (entered !== expectedCode) {
        message.textContent = "That code is incorrect. Please try again.";
        message.style.color = "#d93025";
        return;
      }
      pending.verified = true;
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(pending));
      localStorage.setItem("userEmail", pending.email);
      setSession(pending.username, true);
      sessionStorage.removeItem("miniflixPendingUser");
      sessionStorage.removeItem("miniflixPendingOtp");
      window.location.href = "Home.html";
    });
    $("log-out-btn").addEventListener("click", () => {
      sessionStorage.removeItem("miniflixPendingUser");
      sessionStorage.removeItem("miniflixPendingOtp");
      window.location.href = "Login.html";
    });
  }

  function initCatalogue() {
    const container = $("thumbnailContainer");
    if (!container) return;
    const username = getSession();
    if (!username) {
      window.location.replace(root + "/Login.html");
      return;
    }
    if ($("profileUsername")) $("profileUsername").textContent = username;
    if ($("logoutBtn")) {
      $("logoutBtn").addEventListener("click", event => {
        event.preventDefault();
        clearSession();
        window.location.href = root + "/Login.html";
      });
    }
    if ($("profileIcon") && $("profileMenu")) {
      $("profileIcon").addEventListener("click", () => {
        $("profileMenu").hidden = !$("profileMenu").hidden;
        $("profileIcon").setAttribute("aria-expanded", String(!$("profileMenu").hidden));
      });
    }
    if ($("searchIcon") && $("searchBar")) {
      $("searchIcon").addEventListener("click", () => {
        $("searchBar").hidden = !$("searchBar").hidden;
        if (!$("searchBar").hidden) $("searchBar").focus();
      });
    }

    let catalogue = [];
    let showMyList = false;
    const listKey = "miniflixMyList";
    const getList = () => {
      try { return new Set(JSON.parse(localStorage.getItem(listKey) || "[]")); }
      catch { return new Set(); }
    };
    const saveList = list => localStorage.setItem(listKey, JSON.stringify(Array.from(list)));
    const category = document.body.dataset.category || "all";

    function render() {
      let results = catalogue.filter(item => category === "all" || item.category === category);
      if (showMyList) {
        const saved = getList();
        results = results.filter(item => saved.has(item.id));
        if ($("pageTitle")) $("pageTitle").textContent = "My List";
      } else if ($("pageTitle") && category !== "all") {
        const labels = { movies: "Movies", anime: "Anime", webseries: "Web Series", tvshows: "TV Shows" };
        $("pageTitle").textContent = labels[category] || "Browse titles";
      } else if ($("pageTitle")) {
        $("pageTitle").textContent = "Browse titles";
      }
      const query = $("searchBar") ? $("searchBar").value.trim().toLowerCase() : "";
      if (query) {
        results = results.filter(item =>
          item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
        );
      }
      container.replaceChildren();
      results.forEach(item => {
        const card = document.createElement("article");
        card.className = "thumbnail";
        const link = document.createElement("a");
        link.className = "thumbnail-link";
        link.href = root + "/Video-Player.html?video=" + encodeURIComponent(item.id);
        link.setAttribute("aria-label", "Open " + item.title);
        const image = document.createElement("img");
        image.src = root + "/" + item.thumbnail;
        image.alt = item.title + " poster";
        image.loading = "lazy";
        image.onerror = () => {
          image.onerror = null;
          image.src = root + "/assets/images/AVATAR.jpg";
        };
        const heading = document.createElement("h3");
        heading.textContent = item.title;
        const type = document.createElement("p");
        type.className = "thumbnail-category";
        type.textContent = item.categoryLabel || item.category;
        const status = document.createElement("span");
        status.className = "media-status";
        status.textContent = item.source ? "Ready to play" : "Video not added";
        link.append(image, heading, type, status);
        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = "save-title-button";
        saveButton.textContent = getList().has(item.id) ? "Remove from My List" : "＋ My List";
        saveButton.addEventListener("click", () => {
          const saved = getList();
          if (saved.has(item.id)) saved.delete(item.id);
          else saved.add(item.id);
          saveList(saved);
          render();
        });
        card.append(link, saveButton);
        container.append(card);
      });
      if ($("emptyState")) {
        $("emptyState").hidden = results.length > 0;
        if (!results.length) {
          $("emptyState").textContent = showMyList
            ? "Your list is empty. Add a title using the My List button on a poster."
            : query ? "No titles match your search." : "No titles have been added to this category yet.";
        }
      }
    }

    if ($("showMyList")) {
      $("showMyList").addEventListener("click", event => {
        event.preventDefault();
        showMyList = !showMyList;
        $("showMyList").setAttribute("aria-pressed", String(showMyList));
        render();
      });
    }
    if ($("myListToggle")) {
      $("myListToggle").addEventListener("click", () => {
        const saved = getList();
        if (saved.has("avengers-endgame")) saved.delete("avengers-endgame");
        else saved.add("avengers-endgame");
        saveList(saved);
        $("myListToggle").textContent = saved.has("avengers-endgame") ? "✓ Added to My List" : "＋ My List";
      });
    }
    if ($("searchBar")) $("searchBar").addEventListener("input", render);

    fetch(root + "/data/videos.json")
      .then(response => {
        if (!response.ok) throw new Error("Catalogue request failed.");
        return response.json();
      })
      .then(data => {
        catalogue = Array.isArray(data.videos) ? data.videos : [];
        render();
      })
      .catch(() => {
        if ($("emptyState")) {
          $("emptyState").hidden = false;
          $("emptyState").textContent = "MiniFlix could not load its catalogue. Check the data/videos.json file path.";
        }
      });
  }

  function initPlayer() {
    const video = $("video");
    if (!video) return;
    $("backToHome").href = root + "/Home.html";
    const title = $("playerTitle");
    const status = $("playerStatus");
    const requested = new URLSearchParams(window.location.search).get("video");

    fetch(root + "/data/videos.json")
      .then(response => {
        if (!response.ok) throw new Error("Catalogue request failed.");
        return response.json();
      })
      .then(data => {
        const videos = Array.isArray(data.videos) ? data.videos : [];
        const selected = videos.find(item => item.id === requested || item.source === requested);
        if (!selected) {
          title.textContent = "Title not found";
          status.textContent = "This title is not in the MiniFlix catalogue.";
          return;
        }
        title.textContent = selected.title;
        if (!selected.source) {
          video.hidden = true;
          status.textContent = "The video file for this title has not been added to the repository yet. Add your media file and set its relative path in data/videos.json to enable playback.";
          return;
        }
        video.poster = root + "/" + selected.thumbnail;
        video.src = root + "/" + selected.source;
        video.hidden = false;
        status.textContent = "Use the player controls to watch.";
        video.load();
      })
      .catch(() => {
        title.textContent = "Unable to load title";
        status.textContent = "The MiniFlix catalogue could not be loaded. Check data/videos.json.";
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const mode = document.body.dataset.mode || "";
    if (mode === "landing") initLanding();
    if (mode === "register") initRegister();
    if (mode === "login") initLogin();
    if (mode === "otp") initOtp();
    if (mode === "home" || mode === "category") initCatalogue();
    if (mode === "player") initPlayer();
  });
})();
