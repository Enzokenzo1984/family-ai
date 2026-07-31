"use strict";

(function () {
  const USERS = [
    { id: "elaine", label: "Elaine", relation: "女儿", aiName: "妈妈" },
    { id: "elian", label: "Elian", relation: "女儿", aiName: "妈妈" },
    { id: "ahfen", label: "阿芬", relation: "妹妹", aiName: "阿梅" },
    { id: "nick", label: "Nick", relation: "儿子", aiName: "妈妈" }
  ];

  const STORAGE_KEY = "family-ai-user-profile-v1";
  let selectedId = localStorage.getItem(STORAGE_KEY) || "";

  function getSelectedUser() {
    return USERS.find((user) => user.id === selectedId) || null;
  }

  function saveUser(id) {
    const user = USERS.find((item) => item.id === id);
    if (!user) return;

    selectedId = id;
    localStorage.setItem(STORAGE_KEY, id);
    window.FAMILY_USER_PROFILE = user;
    updateBadge();
    closeModal();
  }

  function updateBadge() {
    const user = getSelectedUser();
    const badge = document.getElementById("familyUserBadge");

    if (!badge) return;

    badge.textContent = user
      ? `${user.label} · ${user.relation}`
      : "选择人物";
  }

  function closeModal() {
    const modal = document.getElementById("familyUserModal");
    if (modal) modal.style.display = "none";
  }

  function openModal() {
    const modal = document.getElementById("familyUserModal");
    if (modal) modal.style.display = "flex";
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #familyUserBadge {
        position: fixed;
        left: 14px;
        bottom: calc(14px + env(safe-area-inset-bottom));
        z-index: 9997;
        border: 0;
        border-radius: 999px;
        padding: 9px 13px;
        background: rgba(255,255,255,.88);
        color: #3b342f;
        box-shadow: 0 8px 24px rgba(60,48,38,.16);
        font-size: 13px;
        font-weight: 700;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      #familyUserModal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(40,34,30,.42);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .family-user-panel {
        width: min(390px, 100%);
        padding: 24px;
        border-radius: 26px;
        background: #f7f2ed;
        box-shadow: 0 24px 70px rgba(30,24,20,.28);
      }

      .family-user-panel h2 {
        margin: 0 0 6px;
        font-size: 25px;
        color: #342f2b;
      }

      .family-user-panel p {
        margin: 0 0 18px;
        color: #776e67;
        line-height: 1.5;
      }

      .family-user-options {
        display: grid;
        gap: 10px;
      }

      .family-user-option {
        width: 100%;
        border: 1px solid rgba(60,48,38,.10);
        border-radius: 17px;
        padding: 14px 16px;
        text-align: left;
        background: rgba(255,255,255,.82);
        color: #342f2b;
        font-size: 16px;
        font-weight: 750;
      }

      .family-user-option small {
        display: block;
        margin-top: 3px;
        color: #776e67;
        font-size: 12px;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  function injectUi() {
    const badge = document.createElement("button");
    badge.id = "familyUserBadge";
    badge.type = "button";
    badge.addEventListener("click", openModal);
    document.body.appendChild(badge);

    const modal = document.createElement("div");
    modal.id = "familyUserModal";
    modal.innerHTML = `
      <div class="family-user-panel" role="dialog" aria-modal="true">
        <h2>请选择人物</h2>
        <p>系统会根据人物关系，自动使用“妈妈”或“阿梅”的身份回答。</p>
        <div class="family-user-options">
          ${USERS.map((user) => `
            <button class="family-user-option" type="button" data-user-id="${user.id}">
              ${user.label}
              <small>${user.relation} · AI 自称：${user.aiName}</small>
            </button>
          `).join("")}
        </div>
      </div>
    `;

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });

    modal.querySelectorAll("[data-user-id]").forEach((button) => {
      button.addEventListener("click", function () {
        saveUser(button.dataset.userId);
      });
    });

    document.body.appendChild(modal);
    updateBadge();

    if (!getSelectedUser()) openModal();
  }

  // Intercept Worker POST requests and add the selected profile automatically.
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input, init) {
    const method = String(init?.method || "GET").toUpperCase();
    const user = getSelectedUser();

    if (method === "POST" && user && typeof init?.body === "string") {
      try {
        const parsed = JSON.parse(init.body);

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          parsed.userId = user.id;
          init = {
            ...init,
            body: JSON.stringify(parsed)
          };
        }
      } catch {
        // Non-JSON requests are left unchanged.
      }
    }

    return originalFetch(input, init);
  };

  const current = getSelectedUser();
  window.FAMILY_USER_PROFILE = current;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectStyles();
      injectUi();
    });
  } else {
    injectStyles();
    injectUi();
  }
})();
