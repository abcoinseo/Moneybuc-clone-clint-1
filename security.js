// security.js

// Global variables for security checks
let userDeviceID = null;
let userIPAddress = null;
let userLoggedInAccounts = {}; // Stores { accountId: timestamp } for accounts logged in from this device

// --- Functions for Security Checks ---

// Generates a unique ID for the device/browser.
// This is a simple approach and might not be foolproof.
function generateDeviceID() {
    if (localStorage.getItem('deviceID')) {
        return localStorage.getItem('deviceID');
    } else {
        const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem('deviceID', id);
        return id;
    }
}

// Attempts to get the user's IP address. This requires a server-side component
// or an external API. For a client-side-only solution, this is limited.
// We'll simulate this by using a placeholder or assuming it's fetched elsewhere.
async function getIPAddress() {
    // In a real application, you'd make an AJAX request to your backend or a service like ipify.org
    // Example:
    // try {
    //     const response = await fetch('https://api.ipify.org?format=json');
    //     const data = await response.json();
    //     return data.ip;
    // } catch (error) {
    //     console.error("Failed to fetch IP address:", error);
    //     return null;
    // }
    // For demonstration purposes, we'll use a placeholder.
    return '192.168.1.100'; // Placeholder IP
}

// Logs the current user's login event to Firebase for IP and Device tracking.
async function logUserLogin(userId) {
    if (!userDeviceID) userDeviceID = generateDeviceID();
    if (!userIPAddress) userIPAddress = await getIPAddress();

    const loginTimestamp = Date.now();

    // Record the login event
    await database.ref('loginLogs/' + userId).push({
        timestamp: loginTimestamp,
        deviceId: userDeviceID,
        ipAddress: userIPAddress
    });

    // Track accounts associated with this device ID
    userLoggedInAccounts[userId] = loginTimestamp;
    localStorage.setItem('userLoggedInAccounts', JSON.stringify(userLoggedInAccounts));

    // Check if this device/IP has too many accounts logged in
    await checkDeviceAndIPLimits(userId);
}

// Checks if the current device or IP address is associated with too many accounts.
async function checkDeviceAndIPLimits(currentUserId) {
    // Get all login logs from Firebase
    const allLoginLogsSnapshot = await database.ref('loginLogs').once('value');
    const allLoginLogs = allLoginLogsSnapshot.val() || {};

    const accountsOnThisDevice = {};
    const accountsOnThisIP = {};

    for (const userId in allLoginLogs) {
        const logs = allLoginLogs[userId];
        for (const logId in logs) {
            const log = logs[logId];
            if (log.deviceId === userDeviceID) {
                accountsOnThisDevice[userId] = true;
            }
            if (log.ipAddress === userIPAddress) {
                accountsOnThisIP[userId] = true;
            }
        }
    }

    // Define your limits (e.g., max 2 accounts per device, max 3 accounts per IP)
    const MAX_ACCOUNTS_PER_DEVICE = 2;
    const MAX_ACCOUNTS_PER_IP = 3;

    const numberOfAccountsOnDevice = Object.keys(accountsOnThisDevice).length;
    const numberOfAccountsOnIP = Object.keys(accountsOnThisIP).length;

    // Check device limit
    if (numberOfAccountsOnDevice > MAX_ACCOUNTS_PER_DEVICE) {
        // If the current user is part of the excess, ban them.
        if (accountsOnThisDevice[currentUserId]) {
            banUser(currentUserId, 'device_limit_exceeded', `This device is associated with ${numberOfAccountsOnDevice} accounts, exceeding the limit of ${MAX_ACCOUNTS_PER_DEVICE}.`);
        }
        return; // Stop further checks if already flagged
    }

    // Check IP limit
    if (numberOfAccountsOnIP > MAX_ACCOUNTS_PER_IP) {
        // If the current user is part of the excess, ban them.
        if (accountsOnThisIP[currentUserId]) {
            banUser(currentUserId, 'ip_limit_exceeded', `This IP address is associated with ${numberOfAccountsOnIP} accounts, exceeding the limit of ${MAX_ACCOUNTS_PER_IP}.`);
        }
        return;
    }
}

// Bans a user and shows a popup.
async function banUser(userId, reasonCode, reasonMessage) {
    console.warn(`User ${userId} is being banned: ${reasonMessage}`);

    // Update user status in Firebase to banned
    await database.ref('users/' + userId).update({
        isBanned: true,
        banReasonCode: reasonCode,
        banReasonMessage: reasonMessage,
        bannedAt: Date.now()
    });

    // Show the ban popup
    showBanPopup(reasonMessage);

    // Optionally, disable all further interactions for this user
    // You might want to remove event listeners or hide buttons.
    disableUserInteractions();
}

// Shows the ban popup to the user.
function showBanPopup(message) {
    const banModal = document.createElement('div');
    banModal.id = 'banModal';
    banModal.className = 'modal'; // Use the existing modal styling
    banModal.style.display = 'block';
    banModal.innerHTML = `
        <div class="modal-content" style="background: var(--dark-secondary); border-color: var(--danger);">
            <div class="modal-header">
                <h3 class="modal-title" style="color: var(--danger);">Account Banned</h3>
                <button class="close-btn" onclick="closeBanPopup()">&times;</button>
            </div>
            <div style="text-align: center;">
                <span class="material-icons" style="font-size: 60px; color: var(--danger); margin-bottom: 20px;">block</span>
                <p style="color: var(--text-light); margin-bottom: 20px;">${message}</p>
                <p style="color: var(--text-light);">If you believe this is a mistake, please contact our support.</p>
                <button class="btn btn-primary" onclick="contactSupport()" style="margin-top: 20px;">Contact Support</button>
            </div>
        </div>
    `;
    document.body.appendChild(banModal);
}

// Closes the ban popup.
function closeBanPopup() {
    const modal = document.getElementById('banModal');
    if (modal) {
        modal.remove();
    }
}

// Placeholder for contacting support.
function contactSupport() {
    const supportLink = 'https://t.me/EarnFluxSupport'; // Replace with your actual support Telegram link
    window.open(supportLink, '_blank');
    closeBanPopup(); // Close the popup after opening support
}

// Disables all interactive elements for a banned user.
function disableUserInteractions() {
    // Disable buttons, inputs, links within the main content area
    document.querySelectorAll('.container button, .container input, .container a').forEach(element => {
        element.disabled = true;
        element.style.cursor = 'not-allowed';
    });
    // You might want to add a semi-transparent overlay to further indicate restriction.
}

// --- Initialization ---

// Call this function very early, ideally when the app is initialized.
async function initializeSecurityChecks() {
    // 1. Generate or retrieve Device ID
    userDeviceID = generateDeviceID();
    console.log("Device ID:", userDeviceID);

    // 2. Attempt to get IP Address
    userIPAddress = await getIPAddress();
    console.log("IP Address:", userIPAddress);

    // 3. Load previously logged-in accounts for this device from local storage
    const storedAccounts = localStorage.getItem('userLoggedInAccounts');
    if (storedAccounts) {
        userLoggedInAccounts = JSON.parse(storedAccounts);
    }

    // 4. If there are accounts logged in from this device, re-check limits
    if (Object.keys(userLoggedInAccounts).length > 0) {
        // Check if any of these accounts are already banned for device/IP reasons
        for (const userId in userLoggedInAccounts) {
            const userRef = database.ref('users/' + userId);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            if (userData && userData.isBanned && (userData.banReasonCode === 'device_limit_exceeded' || userData.banReasonCode === 'ip_limit_exceeded')) {
                // If an already banned user is detected, show the ban popup immediately
                showBanPopup(userData.banReasonMessage);
                disableUserInteractions();
                return; // Stop further initialization if already banned
            }
        }
        // If no banned users are found, re-verify current limits
        await checkDeviceAndIPLimits(null); // Pass null as no specific user is logging in *now*
    }
}


// --- Integration with your existing code ---

// You need to call initializeSecurityChecks() as early as possible in your main script.
// It's best placed right after Firebase is initialized or when Telegram Web App is ready.

// Modify your `initTelegramWebApp()` function:
function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();

        const user = tg.initDataUnsafe?.user;
        if (user) {
            currentUser = {
                id: user.id,
                username: user.username || 'User',
                first_name: user.first_name || 'User',
                photo_url: user.photo_url || 'https://via.placeholder.com/100'
            };

            // --- SECURITY CHECK POINT ---
            // Call security checks AFTER getting user info but BEFORE initializing user data
            initializeSecurityChecks().then(() => {
                // Only proceed with user initialization if not banned during security checks
                if (!document.getElementById('banModal')) {
                    logUserLogin(currentUser.id); // Log this user's login
                    initializeUser();
                }
            }).catch(error => {
                console.error("Error during security initialization:", error);
                showAlert("Security check failed. Please contact support.", "danger");
            });

            // Check for referral parameters in start_param
            const startParam = tg.initDataUnsafe?.start_param;
            if (startParam) {
                if (startParam.startsWith('ref_')) {
                    const referrerId = startParam.replace('ref_', '');
                    handleReferral(referrerId);
                } else if (startParam.startsWith('r_')) { // Handle referral code endpoint
                    const referrerId = startParam.replace('r_', '');
                    handleReferral(referrerId);
                }
            }

        } else {
            // Fallback for testing (assign random ID)
            const randomId = Math.floor(Math.random() * 1000000000); // Use a larger range for uniqueness
            currentUser = {
                id: randomId,
                username: `testuser_${randomId}`,
                first_name: 'Test User',
                photo_url: 'https://via.placeholder.com/100'
            };
            console.warn("Running without Telegram Web App user data. Using a random ID for testing:", currentUser.id);
            // --- SECURITY CHECK POINT FOR TEST USER ---
            initializeSecurityChecks().then(() => {
                 if (!document.getElementById('banModal')) {
                    logUserLogin(currentUser.id);
                    initializeUser();
                }
            }).catch(error => {
                console.error("Error during security initialization for test user:", error);
                showAlert("Security check failed. Please contact support.", "danger");
            });
        }
    } else {
        console.error("Telegram Web App is not available.");
        showAlert("Error: Telegram Web App not detected. Please open this in Telegram.", "danger");
    }
}

// Modify your `banUser` function in `security.js` to match the one defined above.
// Ensure your `showAlert` function is accessible and works as expected.
// Ensure `database` is initialized before `initializeSecurityChecks` is called.

// Example of how to integrate `initializeSecurityChecks`:
// Put this inside your main script, right after Firebase init.
// async function mainAppInitialization() {
//     // ... Firebase init, Telegram Web App init ...
//
//     // Call security checks first
//     await initializeSecurityChecks();
//
//     // If not banned, proceed with other initializations
//     if (!document.getElementById('banModal')) {
//         // ... initializeUser(), loadTasks(), etc. ...
//     }
// }
// document.addEventListener('DOMContentLoaded', mainAppInitialization);

// Make sure your HTML includes the necessary modal structure or that the JS creates it.
// The `showBanPopup` function creates the modal dynamically.

// --- Important Notes and Considerations ---

// 1.  **Server-Side Verification:** For robust security, especially against bots and sophisticated users, client-side checks are not enough. You should implement server-side validation for critical actions like task completion, withdrawals, and referral bonuses. Your backend can store IP addresses and device IDs and perform more reliable checks.
// 2.  **IP Address Fetching:** The `getIPAddress()` function is a placeholder. To get a real IP, you'll need to make an external request. Be mindful of privacy and terms of service for any IP lookup API you use.
// 3.  **Device ID Reliability:** `localStorage` can be cleared by the user or by browser settings. A more persistent device ID might require more advanced techniques or relying on server-side fingerprinting.
// 4.  **False Positives:** Be cautious with automatic bans. A user sharing a Wi-Fi network with many people might trigger IP limits. A family using the same device might trigger device limits. Consider implementing an unban request system or manual review for flagged accounts.
// 5.  **Telegram Data:** Telegram's `initDataUnsafe` can be spoofed if not handled correctly on the server. For critical actions, always verify `initData` on your backend.
// 6.  **Error Handling:** Implement comprehensive error handling for all Firebase operations and API calls.
// 7.  **User Experience:** Clearly inform users why they are banned and provide a path for appeals or contacting support.
// 8.  **Unban Requests:** The `contactSupport` function is a placeholder. You'll need a system to manage unban requests from users.
