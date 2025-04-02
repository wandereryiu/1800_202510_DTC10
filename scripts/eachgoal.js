document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const goalId = urlParams.get("id");

    const auth = firebase.auth();
    const db = firebase.firestore();

    const categoryInput = document.getElementById("editCategory");
    const amountInput = document.getElementById("editAmount");
    const startDateInput = document.getElementById("editStartDate");
    const endDateInput = document.getElementById("editEndDate");
    const goalDetailsDiv = document.getElementById("goalDetails");
    const updateBtn = document.getElementById("updateGoal");
    const deleteBtn = document.getElementById("deleteGoal");

    function loadGoalDetails(userId) {
        db.collection("users").doc(userId).collection("goals").doc(goalId).get()
            .then((doc) => {
                if (doc.exists) {
                    const goalData = doc.data();
    
                    // Populate input fields
                    categoryInput.value = goalData.category || "";
                    amountInput.value = goalData.amount || "";
                    startDateInput.value = goalData.startDate || "";
                    endDateInput.value = goalData.endDate || "";
    
                    // Display goal details
                    goalDetailsDiv.innerHTML = `
                        <div class="flex items-center justify-between w-full">
                            <p class="text-lg text-[#005a00]"><strong class="font-serif">Category:</strong> ${goalData.category}</p>
                            <button id="deleteGoal" class="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                        <p class="text-lg text-[#005a00]"><strong class="font-serif">Amount:</strong> $${goalData.amount}</p>
                        <p class="text-lg text-[#005a00]"><strong class="font-serif">Start Date:</strong> ${goalData.startDate}</p>
                        <p class="text-lg text-[#005a00]"><strong class="font-serif">End Date:</strong> ${goalData.endDate}</p>
                        <p class="text-sm text-[#005a00]"><strong class="font-serif">Last Updated:</strong> 
                        ${(goalData.timestamp && goalData.timestamp.toDate) ? goalData.timestamp.toDate().toLocaleString() : "N/A"}</p>
                    `;
    
                    // Wait for DOM update, then add event listener
                    setTimeout(() => {
                        document.getElementById("deleteGoal").addEventListener("click", () => deleteGoal(userId));
                    }, 100);
                } else {
                    goalDetailsDiv.innerHTML = "<p class='text-red-500'>Goal not found.</p>";
                }
            })
            .catch((error) => {
                console.error("Error loading goal details:", error);
            });
    }
    
    function updateGoal(userId) {
        const updatedGoal = {
            category: categoryInput.value.trim(),
            amount: parseFloat(amountInput.value),
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!updatedGoal.category || isNaN(updatedGoal.amount) || updatedGoal.amount <= 0 || !updatedGoal.startDate || !updatedGoal.endDate) {
            alert("Please enter valid details for all fields.");
            return;
        }

        db.collection("users").doc(userId).collection("goals").doc(goalId).update(updatedGoal)
            .then(() => {
                alert("Goal updated successfully!");
                loadGoalDetails(userId);
            })
            .catch((error) => {
                console.error("Error updating goal:", error);
                alert("Failed to update goal.");
            });
    }

    function deleteGoal(userId) {
        if (confirm("Are you sure you want to delete this goal?")) {
            db.collection("users").doc(userId).collection("goals").doc(goalId).delete()
                .then(() => {
                    alert("Goal deleted successfully!");
                    window.location.href = "goals.html"; // Redirect after deletion
                })
                .catch((error) => {
                    console.error("Error deleting goal:", error);
                    alert("Failed to delete goal.");
                });
        }
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            loadGoalDetails(user.uid);

            updateBtn.addEventListener("click", () => updateGoal(user.uid));
            deleteBtn.addEventListener("click", () => deleteGoal(user.uid));
        } else {
            console.log("No user signed in.");
            goalDetailsDiv.innerHTML = "<p class='text-red-500'>You must be signed in to view goal details.</p>";
        }
    });
});