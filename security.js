// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
    apiKey: "AIzaSyA3SqCHzN3kLj7DC8Cyu9OzxPFtIlyyii4",
    authDomain: "maneybux-clone.firebaseapp.com",
    projectId: "maneybux-clone",
    storageBucket: "maneybux-clone.firebasestorage.app",
    messagingSenderId: "153207109623",
    appId: "1:153207109623:web:4cd48633c49c2ba3c1a0f2",
    databaseURL: "https://maneybux-clone-default-rtdb.firebaseio.com/"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --------------- TELEGRAM MINI APP ----------------
const tg = window.Telegram.WebApp;
tg.expand();

// Get IP
async function getUserIP() {
  try {
    let res = await fetch("https://api64.ipify.org?format=json");
    let data = await res.json();
    return data.ip;
  } catch (e) {
    return "unknown";
  }
}

// Save User Data
async function saveUserData() {
  const user = tg.initDataUnsafe?.user;
  if (!user) return;

  let ip = await getUserIP();
  let userId = user.id;
  let username = user.username || ("user_" + userId);

  let userRef = db.ref("users/" + userId);

  userRef.once("value", (snapshot) => {
    let data = snapshot.val();

    // যদি data না থাকে তাহলে নতুন user তৈরি করো
    if (!data) {
      userRef.set({
        id: userId,
        username: username,
        first_name: user.first_name || "",
        photo_url: user.photo_url || "",
        ip: ip,
        balance: 0,
        adsWatched: 0,
        spins: 0,
        tasksCompleted: 0,
        referrals: 0,
        referralEarnings: 0,
        totalEarned: 0,
        createdAt: Date.now(),
        lastAdReset: Date.now(),
        ban: false
      });
      return;
    }

    // BAN CHECK
    if (data.ban === true) {
      alert("🚫 You are banned for multiple accounts!");
      tg.close();
      return;
    }

    // Multi-account detect (same IP but different username)
    db.ref("users").once("value", (allSnap) => {
      let allUsers = allSnap.val();
      let conflict = false;

      for (let uid in allUsers) {
        if (
          allUsers[uid].ip === ip &&
          allUsers[uid].username !== username
        ) {
          conflict = true;
          break;
        }
      }

      if (conflict) {
        userRef.update({ ban: true }); // Mark user as banned
        alert("🚫 You are banned for using multiple accounts on one device!");
        tg.close();
        return;
      } else {
        // Update normal user info
        userRef.update({
          username: username,
          ip: ip,
          lastLogin: Date.now(),
          ban: false
        });
      }
    });
  });
}

saveUserData();
