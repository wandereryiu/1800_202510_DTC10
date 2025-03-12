// Ensure Firebase is initialized in firebaseAPI_dtcteam10.js

$(document).ready(function () {
    $("#save-btn").on("click", function (event) {
        event.preventDefault();

        const category = $("#category-input").val().trim();
        const goal = $("#goal-input").val().trim();
        const startDate = $("#datepicker-range-start").val().trim();
        const endDate = $("#datepicker-range-end").val().trim();

        if (!category || !goal || !startDate || !endDate) {
            alert("Please fill in all fields");
            return;
        }

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                db.collection("users").doc(user.uid).collection("goals").add({
                    category,
                    goal,
                    startDate,
                    endDate,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    alert("Goal saved successfully!");
                    $("#category-input, #goal-input, #datepicker-range-start, #datepicker-range-end").val("");
                    loadGoals(); // Reload table after saving
                })
                .catch(error => {
                    console.error("Error saving goal: ", error);
                });
            } else {
                alert("Please log in to save your goal.");
            }
        });
    });

    function loadGoals() {
        const tableBody = $("#selection-table tbody");

        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const querySnapshot = await db.collection("users").doc(user.uid).collection("goals").orderBy("timestamp", "desc").get();
                    tableBody.empty(); // Clear existing data

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        const row = `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                <td class="font-medium text-gray-900 whitespace-nowrap dark:text-white">${data.category}</td>
                                <td>${data.startDate}</td>
                                <td>${data.endDate}</td>
                                <td>${data.growth ? data.growth + "%" : "N/A"}</td>
                            </tr>
                        `;
                        tableBody.append(row);
                    });
                } catch (error) {
                    console.error("Error fetching data: ", error);
                }
            }
        });
    }

    // Load goals when the page loads
    loadGoals();
});