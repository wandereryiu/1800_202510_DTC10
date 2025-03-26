document.addEventListener("DOMContentLoaded", async () => {
    const user = auth.currentUser;
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            document.getElementById("name").value = userDoc.data().name;
            document.getElementById("profile-img").src = userDoc.data().photoURL;
        }
    }
});

document.getElementById("update-profile").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("User not signed in");

    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;
    const file = document.getElementById("profile-picture").files[0];

    let photoURL = user.photoURL;
    if (file) {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
    }

    await updateProfile(user, { displayName: name, photoURL });
    if (password) await updatePassword(user, password);
    await setDoc(doc(db, "users", user.uid), { name, photoURL }, { merge: true });

    alert("Profile updated successfully!");
});