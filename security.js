
// =================== MULTI ACCOUNT DETECTION ===================

// Function to generate a unique device fingerprint
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 16);
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

// Simulate a database of banned accounts (replace with your real backend)
let bannedAccounts = JSON.parse(localStorage.getItem('banned_accounts') || '[]');

// Check if the current user is banned
function checkBan(currentUserId) {
    if (bannedAccounts.includes(currentUserId)) {
        alert("⚠️ This account is banned for multi-account use on the same device!");
        // Optional: redirect or hide app
        document.body.innerHTML = "<h1>Account banned 🚫</h1>";
        return true;
    }
    return false;
}

// Main function to register account
function registerAccount(currentUserId) {
    const deviceId = getDeviceId();

    // Track accounts per device
    let deviceAccounts = JSON.parse(localStorage.getItem(deviceId) || '[]');

    if (deviceAccounts.includes(currentUserId)) {
        // Already registered, allow normal use
        console.log("Welcome back! ✅");
    } else {
        deviceAccounts.push(currentUserId);
        localStorage.setItem(deviceId, JSON.stringify(deviceAccounts));

        // If more than 1 account on the same device → ban the new account
        if (deviceAccounts.length > 1) {
            bannedAccounts.push(currentUserId);
            localStorage.setItem('banned_accounts', JSON.stringify(bannedAccounts));
            alert("⚠️ Multi-account detected! This account is now banned.");
            document.body.innerHTML = "<h1>Account banned 🚫</h1>";
        } else {
            console.log("Account registered ✅");
        }
    }
}

// =================== EXAMPLE USAGE ===================
// Replace this with Telegram WebApp user ID
const currentUserId = window.Telegram?.WebApp?.initData?.user?.id || prompt("Enter user ID");
if (!checkBan(currentUserId)) {
    registerAccount(currentUserId);
}

