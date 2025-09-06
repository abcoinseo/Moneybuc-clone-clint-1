document.addEventListener("DOMContentLoaded", () => {
  // ===================== TELEGRAM USER =====================
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.error("❌ Telegram WebApp not found!");
    return;
  }
  tg.expand();

  const user = tg.initDataUnsafe?.user;
  if (!user) {
    console.error("❌ User not detected!");
    tg.close();
    return;
  }

  // ===================== DEVICE FINGERPRINT =====================
  function getDeviceId() {
    return btoa(
      navigator.userAgent +
      screen.width + "x" + screen.height +
      navigator.language
    );
  }
  const deviceId = getDeviceId();

  // ===================== LOCAL STORAGE =====================
  let accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

  // ===================== MULTI-ACCOUNT DETECT =====================
  const found = accounts.find(acc => acc.deviceId === deviceId);
  if (found && found.userId !== user.id) {
    // শুধু warning দেখাবে, apps বন্ধ করবে না
    const warning = document.createElement("div");
    warning.innerHTML = `
      <div style="background:#ffcccc;color:#b91c1c;
                  padding:10px;text-align:center;
                  font-family:sans-serif;font-weight:bold;">
        ⚠️ Warning: Multiple accounts detected on this device!
      </div>
    `;
    document.body.prepend(warning);
  }

  // ===================== REGISTER ACCOUNT =====================
  if (!found) {
    accounts.push({ userId: user.id, deviceId });
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }

  // ===================== তোমার Apps content আগের মতোই থাকবে =====================
  const mainApp = document.createElement("div");
  mainApp.innerHTML = `
    <div style="font-family:sans-serif;text-align:center;padding:20px;">
      <h2>👋 Welcome, ${user.first_name}</h2>
      <p>✅ You are verified on this device.</p>
      <p>UserID: ${user.id}</p>
      <p>DeviceID: ${deviceId}</p>
    </div>
  `;
  document.body.appendChild(mainApp);
});
