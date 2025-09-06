document.addEventListener("DOMContentLoaded", () => {
  // ===================== TELEGRAM USER =====================
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.error("Telegram WebApp not found!");
    return;
  }
  tg.expand(); // Full screen

  const user = tg.initDataUnsafe?.user;
  if (!user) {
    console.error("Telegram user not found!");
    return;
  }

  // ===================== DEVICE ID =====================
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2);
    localStorage.setItem("device_id", deviceId);
  }

  // ===================== BAN POPUP =====================
  function showBanPopup() {
    document.body.innerHTML = `
      <div style="color:red;font-weight:bold;font-size:22px;text-align:center;margin-top:50px">
        🚫 You are permanently banned!<br>
        Please contact support.
      </div>
    `;

    setTimeout(() => {
      if (tg.close) tg.close();
    }, 4000);
  }

  // ===================== CHECK USER =====================
  async function checkUser() {
    if (!firebase || !firebase.database) {
      console.error("Firebase not initialized!");
      return;
    }

    const db = firebase.database();
    const userRef = db.ref("users/" + user.id);

    userRef.once("value", async (snapshot) => {
      const data = snapshot.val();

      // যদি আগে থেকেই Ban থাকে = শুধু popup
      if (data?.ban === true) {
        showBanPopup();
        return;
      }

      // ইউজারকে Update/Save করো
      await userRef.update({
        id: user.id,
        first_name: user.first_name,
        username: user.username || ("user_" + user.id),
        deviceId: deviceId,
        ban: false,
        lastLogin: Date.now()
      });

      // Multi-account check
      db.ref("users").once("value", (snap) => {
        const users = snap.val() || {};
        let count = 0;

        for (let uid in users) {
          if (users[uid].deviceId === deviceId) count++;
        }

        if (count > 1) {
          // একাধিক ইউজার পাওয়া গেছে = BAN করো
          for (let uid in users) {
            if (users[uid].deviceId === deviceId) {
              db.ref("users/" + uid).update({ ban: true });
            }
          }
          showBanPopup();
        } else {
          // Safe login
          const statusEl = document.getElementById("status");
          if (statusEl) {
            statusEl.innerText = "✅ Safe login: " + user.first_name;
          }
        }
      });
    });
  }

  checkUser();
});
