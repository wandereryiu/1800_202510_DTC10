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
    if (!user) return alert("User not signed in");

    try {
        const name = document.getElementById("name").value;
        const password = document.getElementById("password").value;
        const fileInput = document.getElementById("profile-picture");
        const file = fileInput ? fileInput.files[0] : null;

        let photoURL = user.photoURL;
        if (file) {
            const storageRef = firebase.storage().ref(`profile_pictures/${user.uid}`);
            await storageRef.put(file);
            photoURL = await storageRef.getDownloadURL();
        }

        // Update profile
        await user.updateProfile({ displayName: name, photoURL });

        // Update password if provided
        if (password) {
            // Prompt for current password for security
            const currentPassword = prompt("Please enter your current password to confirm the password change:");
            if (currentPassword) {
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );

                // Reauthenticate and update password
                await user.reauthenticateWithCredential(credential);
                await user.updatePassword(password);
            } else {
                // If user cancels the prompt, skip password update
                console.log("Password update cancelled");
            }
        }

        // Update Firestore
        await firebase.firestore().collection("users").doc(user.uid).set({
            name,
            photoURL
        }, { merge: true });

        alert("Profile updated successfully!");
        // Refresh the page to show updated profile
        window.location.reload();
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile: " + error.message);
    }
});