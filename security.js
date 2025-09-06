<script>
document.addEventListener("DOMContentLoaded", async () => {
  // ===================== TELEGRAM USER =====================
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.error("Telegram WebApp not found!");
    return;
  }
  tg.expand();

  const user = tg.initDataUnsafe?.user;
  if (!user) {
    console.error("Telegram user not found!");
    return;
  }

  // ===================== BAN POPUP =====================
  function showBanPopup() {
    document.body.innerHTML = `
      <div style="color:red;font-weight:bold;font-size:22px;text-align:center;margin-top:50px">
        🚫 You are permanently banned!<br>
        Please contact support.
      </div>
    `;
    setTimeout(() => tg.close && tg.close(), 4000);
  }

  // ===================== GET USER IP =====================
  let userIp = null;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    userIp = data.ip;
  } catch (err) {
    console.error("Failed to fetch IP:", err);
    userIp = "unknown_ip";
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

      // আগেই Ban থাকলে সরাসরি popup
      if (data?.ban === true) {
        showBanPopup();
        return;
      }

      // ইউজারকে Save/Update করো
      await userRef.update({
        id: user.id,
        first_name: user.first_name,
        username: user.username || ("user_" + user.id),
        ip: userIp,
        ban: false,
        lastLogin: Date.now()
      });

      // সব ইউজার চেক করো
      db.ref("users").once("value", (snap) => {
        const users = snap.val() || {};
        let count = 0;

        for (let uid in users) {
          if (users[uid].ip === userIp) count++;
        }

        if (count > 1) {
          // এক IP তে একাধিক অ্যাকাউন্ট = BAN
          for (let uid in users) {
            if (users[uid].ip === userIp) {
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
</script>
