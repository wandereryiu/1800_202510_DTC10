document.addEventListener("DOMContentLoaded", function () {
    const saveBtn = document.getElementById("save-btn");
    const categoryInput = document.getElementById("large-input");
    const amountInput = document.getElementById("expenseAmount");
    const startDate = document.getElementById("datepicker-range-start");
    const endDate = document.getElementById("datepicker-range-end");

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Function to save a goal
    function saveGoal(userId) {
        console.log("saveGoal function called with userId:", userId);
    
        const category = categoryInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const startDateVal = startDate.value;  // Fixing variable name clash
        const endDateVal = endDate.value;
    
        console.log("Category:", category);
        console.log("Amount:", amount);
        console.log("Start Date:", startDateVal);
        console.log("End Date:", endDateVal);
    
        if (!category || isNaN(amount) || amount <= 0 || !startDateVal || !endDateVal) {
            alert("Please enter valid details for all fields.");
            return;
        }
    
        db.collection("users").doc(userId).collection("goals").add({
            category: category,
            amount: amount,
            startDate: startDateVal,
            endDate: endDateVal,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            console.log("Goal saved successfully!");
            alert("Goal saved successfully!");
    
            // Clear inputs
            categoryInput.value = "";
            amountInput.value = "";
            startDate.value = "";
            endDate.value = "";
    
            // Reload goals
            loadGoals(userId);
        })
        .catch((error) => {
            console.error("Error saving goal:", error);
            alert("Failed to save goal. Check the console for details.");
        });
    
    }

    // Function to load goals
    function loadGoals(userId) {
        const goalsList = document.getElementById("goalslist");
        db.collection("users").doc(userId).collection("goals").orderBy("timestamp", "desc").get()
        .then((querySnapshot) => {
            goalsList.innerHTML = ""; // Clear existing content
            querySnapshot.forEach((doc) => {
                const goal = doc.data();
                
                const goalItem = document.createElement("div");
                goalItem.classList.add("p-3", "bg-[#f2f2f2]", "rounded-md", "shadow-md", "cursor-pointer", "hover:bg-[#b5e3b3]", "flex", "justify-between", "items-center");

                goalItem.innerHTML = `
                <div>
                    <p class="text-xl font-bold text-[#005a00]">${goal.category || "N/A"}</p>
                    <p class="text-lg text-[#005a00]">$${goal.amount || "0.00"}</p>
                </div>
                <a href="eachgoal.html?id=${doc.id}" class="text-[#005a00] hover:underline text-sm inline-flex items-center font-extrabold">
                    View Details
                    <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                    </svg>
                </a>
            `;
                
                goalsList.appendChild(goalItem);
            });
        })
        .catch((error) => {
            console.error("Error loading goals: ", error);
        });
    }

    // Wait for authentication
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadGoals(user.uid);

            saveBtn.addEventListener("click", function () {
                console.log("Save button clicked!");  // Debugging
                saveGoal(user.uid);
            });
        } else {
            console.log("No user signed in.");
        }
    });
});
