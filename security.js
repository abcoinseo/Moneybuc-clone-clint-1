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
  let bans = JSON.parse(localStorage.getItem("bannedUsers") || "[]");
  let accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

  // ===================== BAN CHECK =====================
  if (bans.includes(user.id) || bans.includes(deviceId)) {
    document.body.innerHTML = "<h2 style='color:red;text-align:center;'>🚫 You are banned!</h2>";
    setTimeout(() => tg.close(), 3000);
    return;
  }

  // ===================== MULTI-ACCOUNT DETECT =====================
  const found = accounts.find(acc => acc.deviceId === deviceId);
  if (found && found.userId !== user.id) {
    // Multi account detected!
    bans.push(user.id);
    bans.push(deviceId);
    localStorage.setItem("bannedUsers", JSON.stringify(bans));

    document.body.innerHTML = "<h2 style='color:red;text-align:center;'>🚫 Multi-account detected, banned!</h2>";
    setTimeout(() => tg.close(), 3000);
    return;
  }

  // ===================== REGISTER ACCOUNT =====================
  if (!found) {
    accounts.push({ userId: user.id, deviceId });
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }

  // ===================== SHOW DASHBOARD =====================
  document.body.innerHTML = `
    <div style="font-family:sans-serif;text-align:center;padding:20px;">
      <h2>👋 Welcome, ${user.first_name}</h2>
      <p>✅ You are verified on this device.</p>
      <p>UserID: ${user.id}</p>
      <p>DeviceID: ${deviceId}</p>
    </div>
  `;
});
