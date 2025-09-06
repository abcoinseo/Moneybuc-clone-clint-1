document.addEventListener("DOMContentLoaded", async () => {
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

  // ===================== DEVICE + BROWSER FINGERPRINT =====================
  function getDeviceId() {
    return btoa(
      navigator.userAgent +
      screen.width + "x" + screen.height +
      navigator.language
    );
  }
  const deviceId = getDeviceId();

  // ===================== PUBLIC IP ADDRESS =====================
  async function getIP() {
    try {
      let res = await fetch("https://api.ipify.org?format=json");
      let data = await res.json();
      return data.ip;
    } catch (e) {
      console.error("IP fetch failed", e);
      return "unknown";
    }
  }
  const ipAddress = await getIP();

  // ===================== LOCAL STORAGE =====================
  let bans = JSON.parse(localStorage.getItem("bannedUsers") || "[]");
  let accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

  // ===================== BAN CHECK =====================
  if (bans.includes(user.id) || bans.includes(deviceId) || bans.includes(ipAddress)) {
    document.body.innerHTML = `
      <h2 style='color:red;text-align:center;margin-top:30px;'>
        🚫 You are banned from this app!
      </h2>
    `;
    setTimeout(() => tg.close(), 3000);
    return;
  }

  // ===================== MULTI-ACCOUNT DETECT =====================
  const found = accounts.find(acc => acc.deviceId === deviceId || acc.ip === ipAddress);

  if (found && found.userId !== user.id) {
    // 🚨 Multi-account detected → Ban
    bans.push(user.id);
    bans.push(deviceId);
    bans.push(ipAddress);
    localStorage.setItem("bannedUsers", JSON.stringify(bans));

    document.body.innerHTML = `
      <h2 style='color:red;text-align:center;margin-top:30px;'>
        🚫 Multi-account detected, you are banned!
      </h2>
    `;
    setTimeout(() => tg.close(), 3000);
    return;
  }

  // ===================== SAFE USER → SHOW APP =====================
  document.body.innerHTML = `
    <div style="font-family:sans-serif;text-align:center;padding:20px;">
      <h2>👋 Welcome, ${user.first_name}</h2>
      <p>✅ You are verified on this device.</p>
      <p>UserID: ${user.id}</p>
      <p>DeviceID: ${deviceId}</p>
      <p>IP: ${ipAddress}</p>
    </div>
  `;
});
