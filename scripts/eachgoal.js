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
    const depositInput = document.getElementById("DepositAmount");
    const depositDateInput = document.getElementById("DepositData");
    const recordDepositBtn = document.getElementById("recordDeposit");
    const progressText = document.getElementById("progressPercentage");
    const totalDepositText = document.getElementById("averageMonthlyPayment");
    const depositLogDiv = document.getElementById("Deposit-log");

    function loadGoalDetails(userId) {
        db.collection("users").doc(userId).collection("goals").doc(goalId).get()
            .then((doc) => {
                if (doc.exists) {
                    const goalData = doc.data();

                    categoryInput.value = goalData.category || "";
                    amountInput.value = goalData.amount || "";
                    startDateInput.value = goalData.startDate || "";
                    endDateInput.value = goalData.endDate || "";

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
                    `;

                    loadDeposits(userId, goalData.amount);

                    // Attach event listener for the delete button here
                    const deleteGoalBtn = document.getElementById("deleteGoal");
                    deleteGoalBtn.addEventListener("click", () => deleteGoal(userId));

                    // Attach event listeners for update button as well
                    updateBtn.addEventListener("click", () => updateGoal(userId, goalData));
                } else {
                    goalDetailsDiv.innerHTML = "<p class='text-red-500'>Goal not found.</p>";
                }
            })
            .catch((error) => {
                console.error("Error loading goal details:", error);
            });

    }

    function updateGoal(userId, goalData) {
        const updatedCategory = categoryInput.value;
        const updatedAmount = parseFloat(amountInput.value);
        let updatedStartDate = startDateInput.value;
        let updatedEndDate = endDateInput.value;

        // If the startDate or endDate is not changed (empty input), keep the original date values
        if (!updatedStartDate) {
            updatedStartDate = goalData.startDate;  // Keep original startDate
        }
        if (!updatedEndDate) {
            updatedEndDate = goalData.endDate;  // Keep original endDate
        }

        if (isNaN(updatedAmount) || updatedAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const updatedGoalData = {
            category: updatedCategory,
            amount: updatedAmount,
            startDate: updatedStartDate,
            endDate: updatedEndDate
        };

        db.collection("users").doc(userId).collection("goals").doc(goalId).update(updatedGoalData)
            .then(() => {
                alert("Goal updated successfully!");
                loadGoalDetails(userId);  // Reload goal details after update
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
                    window.location.href = "/goals.html";  // Redirect to goals page
                })
                .catch((error) => {
                    console.error("Error deleting goal:", error);
                    alert("Failed to delete goal.");
                });
        }
    }

    function recordDeposit(userId) {
        const depositAmount = parseFloat(depositInput.value);
        const depositDate = depositDateInput.value;

        if (isNaN(depositAmount) || depositAmount <= 0 || !depositDate) {
            alert("Please enter a valid deposit amount and date.");
            return;
        }

        const depositData = {
            amount: depositAmount,
            date: depositDate,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("users").doc(userId).collection("eachgoals").doc(goalId).collection("deposits").add(depositData)
            .then(() => {
                alert("Deposit recorded successfully!");
                loadDeposits(userId, parseFloat(amountInput.value));
            })
            .catch((error) => {
                console.error("Error recording deposit:", error);
                alert("Failed to record deposit.");
            });
    }

    function loadDeposits(userId, goalAmount) {
        db.collection("users").doc(userId).collection("eachgoals").doc(goalId).collection("deposits")
            .orderBy("timestamp", "asc")
            .get()
            .then((querySnapshot) => {
                let totalDeposited = 0;
                depositLogDiv.innerHTML = "";

                querySnapshot.forEach((doc) => {
                    const deposit = doc.data();
                    totalDeposited += deposit.amount;

                    depositLogDiv.innerHTML += `
                        <div class="p-2 bg-gray-100 rounded-md shadow-md">
                            <p class="text-m "><strong>Amount:</strong> $${deposit.amount.toFixed(2)}</p>
                            <p class="text-m "><strong>Date:</strong> ${deposit.date}</p>
                        </div>
                    `;
                });

                // Calculate progress and remaining amount
                const progress = ((totalDeposited / goalAmount) * 100).toFixed(2);
                progressText.innerText = `${progress}%`;

                // Calculate remaining amount to be deposited
                const remainingAmount = goalAmount - totalDeposited;
                totalDepositText.innerText = `$${remainingAmount.toFixed(2)}`;  // Show remaining amount to be deposited
            })
            .catch((error) => {
                console.error("Error loading deposits:", error);
            });
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            loadGoalDetails(user.uid);

            recordDepositBtn.addEventListener("click", () => recordDeposit(user.uid));
        } else {
            console.log("No user signed in.");
            goalDetailsDiv.innerHTML = "<p class='text-red-500'>You must be signed in to view goal details.</p>";
        }
    });
});