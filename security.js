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

  // ===================== MULTI ACCOUNT CHECK =====================
  function showBanPopup() {
    document.body.innerHTML =
      "<div style='color:red;font-weight:bold;font-size:20px;text-align:center;margin-top:50px'>🚫 You are banned for multiple accounts.<br>Please contact support.</div>";

    setTimeout(() => {
      if (tg.close) tg.close();
    }, 3000);
  }

  async function checkUser() {
    if (!firebase || !firebase.database) {
      console.error("Firebase not initialized!");
      return;
    }

    const db = firebase.database();
    const userRef = db.ref("users/" + user.id);

    userRef.once("value", async (snapshot) => {
      const data = snapshot.val();

      // যদি আগেই Ban থাকে
      if (data?.ban === true) {
        showBanPopup();
        return;
      }

      // Save/update user with deviceId
      await userRef.set({
        id: user.id,
        first_name: user.first_name,
        username: user.username || ("user_" + user.id),
        deviceId: deviceId,
        ban: false,
        lastLogin: Date.now()
      });

      // Check all users for multi-account on same device
      db.ref("users").once("value", (snap) => {
        const users = snap.val() || {};
        let count = 0;

        for (let uid in users) {
          if (users[uid].deviceId === deviceId) count++;
        }

        if (count > 1) {
          // BAN all users on this device
          for (let uid in users) {
            if (users[uid].deviceId === deviceId) {
              db.ref("users/" + uid).update({ ban: true });
            }
          }
          showBanPopup();
        } else {
          document.getElementById("status").innerText =
            "✅ Safe login: " + user.first_name;
        }
      });
    });
  }

  checkUser();
});
