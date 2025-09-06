// ========== Firebase Configuration ==========
const firebaseConfig = {
  apiKey: "AIzaSyA3SqCHzN3kLj7DC8Cyu9OzxPFtIlyyii4",
  authDomain: "maneybux-clone.firebaseapp.com",
  projectId: "maneybux-clone",
  storageBucket: "maneybux-clone.firebasestorage.app",
  messagingSenderId: "153207109623",
  appId: "1:153207109623:web:4cd48633c49c2ba3c1a0f2"
};

try {
  firebase.initializeApp(firebaseConfig);
  firebase.app();
} catch (error) {
  console.error("Firebase initialization error:", error);
  alert("Firebase initialization failed.");
}
const database = firebase.database();

// ========== Ban System Logic ==========
const ADMIN_USER_IDS = [123456789, 987654321];
let currentUser = null;
let currentUserIsBanned = false;

function isAdmin() {
  if (!currentUser || !currentUser.id) return false;
  return ADMIN_USER_IDS.includes(currentUser.id);
}

async function checkUserBanStatus(userId) {
  const userRef = database.ref('users/' + userId);
  const snapshot = await userRef.once('value');
  const userData = snapshot.val();
  currentUserIsBanned = userData && userData.isBanned === true;
  return currentUserIsBanned;
}

function displayBanMessage() {
  const container = document.querySelector('.container');
  if (!container) return;
  container.innerHTML = `
    <div style="text-align:center; padding:30px;">
      <h2>🚫 Account Banned</h2>
      <p>Your account has been banned. Contact support at
      <a href="https://t.me/jhahidul52" target="_blank">Telegram</a></p>
    </div>
  `;
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) bottomNav.style.display = 'none';
}

async function enforceBan() {
  if (!currentUser || !currentUser.id) return false;
  if (currentUserIsBanned) {
    displayBanMessage();
    return true;
  }
  const banned = await checkUserBanStatus(currentUser.id);
  if (banned) {
    displayBanMessage();
    return true;
  }
  return false;
}

// অন্যান্য functions (banUser, unbanUser, initializeUser, spinWheel, watchAd ইত্যাদি)
// --- তোমার আগের কোড থেকে কপি করে এখানে রাখতে হবে ---
