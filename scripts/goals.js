let currentUser;

// Wait for authentication once
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        loadGoals(); // Load goals after authentication
    } else {
        console.log("No user is signed in");
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
});

$(document).ready(function () {
    $("#save-btn").on("click", async function (event) {
        event.preventDefault();

        const category = $("#large-input").val().trim();
        const goal = $("#expenseAmount").val().trim();
        const startDate = $("#datepicker-range-start").val().trim();
        const endDate = $("#datepicker-range-end").val().trim();

        if (!category || !goal || !startDate || !endDate) {
            alert("Please fill in all fields");
            return;
        }

        if (!currentUser) {
            alert("Please log in to save your goal.");
            return;
        }

        try {
            await db.collection("users").doc(currentUser.uid).collection("goals").add({
                category,
                goal,
                startDate,
                endDate,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Goal saved successfully!");
            $("#large-input, #expenseAmount, #datepicker-range-start, #datepicker-range-end").val("");
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Ensure Firestore writes first
            loadGoals();
        } catch (error) {
            console.error("Error saving goal: ", error);
        }
    });

    function loadGoals() {
        const tableBody = document.getElementById('table-body');

        if (!currentUser) return;

        db.collection("users").doc(currentUser.uid).collection("goals").orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
                tableBody.innerHTML = ""; // Clear previous data
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const row = `
                        <tr class="hover:bg-[#005a00] dark:hover:bg-[#78e378] cursor-pointer rounded-full">
                            <td class="font-medium text-gray-900 whitespace-nowrap dark:text-[#005a00]">${data.category}</td>
                            <td>${data.startDate}</td>
                            <td>${data.endDate}</td>
                            <td>${data.growth ? data.growth + "%" : "N/A"}</td>
                        </tr>
                    `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });
            }, (error) => {
                console.error("Error fetching data: ", error);
            });
    }
});