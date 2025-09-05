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

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --------------- TELEGRAM MINI APP ----------------
const tg = window.Telegram.WebApp;
tg.expand();

// Get IP Address
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

    // Check if banned
    db.ref("banned/" + username).once("value", (banSnap) => {
      let banData = banSnap.val();
      if (banData && banData.ban === true) {
        alert("🚫 You are permanently banned!");
        tg.close();
        return;
      }
    });

    // Detect multi-account on same IP/device
    if (data && data.ip === ip && data.username !== username) {
      alert("🚫 You are permanently banned!");
      db.ref("banned/" + username).set({
        username: username,
        ip: ip,
        ban: true,
        reason: "Multiple accounts on same device"
      });
      tg.close();
      return;
    }

    // Save/Update user data
    userRef.set({
      userId: userId,
      username: username,
      chatId: userId,
      ip: ip,
      ban: false
    });
  });
}

saveUserData();
