// Show confirmation dialog
function showConfirmationDialog(message, title = 'Success', shouldRefresh = false) {
    // Check if a confirmation dialog already exists and remove it
    const existingConfirm = document.getElementById('custom-confirm-dialog');
    if (existingConfirm) {
        existingConfirm.remove();
    }

    // Create the confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.id = 'custom-confirm-dialog';
    confirmDialog.className = 'fixed inset-0 flex items-center justify-center z-50';
    confirmDialog.innerHTML = `
        <div class="fixed inset-0 bg-transparent"></div>

        <div class="bg-white rounded-lg shadow-lg p-6 w-80 relative z-10 border-2 border-[#005a00]">
            <h3 class="text-lg font-bold text-[#005a00] mb-4">${title}</h3>
            <p class="mb-6 text-gray-700">${message}</p>
            <div class="flex justify-end">
                <button id="confirm-ok" class="px-4 py-2 bg-[#005a00] text-white rounded-lg hover:bg-[#169416] transition-colors">
                    OK
                </button>
            </div>
        </div>
    `;

    // Add to body
    document.body.appendChild(confirmDialog);

    // Add event listeners
    document.getElementById('confirm-ok').addEventListener('click', () => {
        confirmDialog.remove();
        if (shouldRefresh) {
            window.location.reload();
        }
    });

    // Ensure backdrop click closes the dialog safely
    const backdrop = document.getElementById('dialog-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => confirmDialog.remove());
    }
}

// Wait for authentication state to be ready
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // Get user data from Firestore
        const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            document.getElementById("name").value = userDoc.data().name || user.displayName || "";
            document.getElementById("profile-img").src = userDoc.data().photoURL || "https://apicms.thestar.com.my/uploads/images/2024/11/21/3028163.webp";
        }
    } else {
        window.location.href = "login.html"; // Redirect if not authenticated
    }
});

document.getElementById("update-profile").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (!user) {
        showConfirmationDialog("Please sign in to update your profile", "Error");
        return;
    }

    try {
        const name = document.getElementById("name").value;
        const newPassword = document.getElementById("password").value;
        const currentPassword = document.getElementById("current-password").value;
        const fileInput = document.getElementById("profile-picture");
        const file = fileInput ? fileInput.files[0] : null;

        let photoURL = user.photoURL;
        if (file) {
            const storageRef = firebase.storage().ref(`profile_pictures/${user.uid}`);
            await storageRef.put(file);
            photoURL = await storageRef.getDownloadURL();
        }

        // If new password is provided, verify current password is also provided
        if (newPassword && !currentPassword) {
            showConfirmationDialog("Please enter your current password to change your password", "Error");
            return;
        }

        // If current password is provided but no new password, warn user
        if (currentPassword && !newPassword) {
            showConfirmationDialog("Please enter a new password", "Error");
            return;
        }

        // Update profile first
        await user.updateProfile({ displayName: name, photoURL });

        let successMessage = "Profile updated successfully!";

        // Update password if provided
        if (newPassword && currentPassword) {
            try {
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );

                // Reauthenticate and update password
                await user.reauthenticateWithCredential(credential);
                await user.updatePassword(newPassword);
                successMessage = "Profile and password updated successfully!";
            } catch (error) {
                if (error.code === 'auth/wrong-password') {
                    showConfirmationDialog("Current password is incorrect", "Error");
                    return;
                }
                throw error; // Re-throw other errors
            }
        }

        // Update Firestore
        await firebase.firestore().collection("users").doc(user.uid).set({
            name,
            photoURL
        }, { merge: true });

        // Clear password fields
        document.getElementById("password").value = "";
        document.getElementById("current-password").value = "";

        // Show success message and refresh only after clicking OK
        showConfirmationDialog(successMessage, "Success", true);
    } catch (error) {
        console.error("Error updating profile:", error);
        let errorMessage = "Error updating profile: ";

        // Customize error messages based on error type
        switch (error.code) {
            case 'auth/weak-password':
                errorMessage += "New password is too weak. Please use at least 6 characters.";
                break;
            case 'auth/requires-recent-login':
                errorMessage += "Please sign out and sign in again before changing your password.";
                break;
            default:
                errorMessage += error.message;
        }

        showConfirmationDialog(errorMessage, "Error");
    }
});