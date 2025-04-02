// Ensure Firebase Auth is loaded
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        const userId = user.uid; // Get logged-in user's ID

        // Get the category from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get("category");
        document.getElementById("category-name").textContent = category;

        const expensesList = document.getElementById("expenses-list");

        // Fetch expenses for the selected category and user
        db.collection("expenses")
            .where("category", "==", category)
            .where("userId", "==", userId) // Filter by logged-in user
            .get()
            .then((querySnapshot) => {
                expensesList.innerHTML = ""; // Clear previous entries
                if (querySnapshot.empty) {
                    expensesList.innerHTML = "<p>No expenses found in this category.</p>";
                } else {
                    querySnapshot.forEach((doc) => {
                        const expense = doc.data();
                        const formattedDate = new Date(expense.date).toLocaleDateString(); // Format date
                        const bgColor = "bg-[#f2f2f2]"; // Change as needed

                        expensesList.innerHTML += `
                            <div class="p-2 ${bgColor} rounded-md transition-colors border border-gray-200 shadow-sm w-full">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="flex items-center gap-2 ">
                                            <span class="text-sm text-[#005a00]">${formattedDate}</span>
                                        </div>
                                        <p class="font-semibold text-[#005a00]">${expense.category}</p>
                                        <p class="text-sm text-[#005a00]">${expense.description}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <p class="font-bold text-[#005a00]">$${expense.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
            })
            .catch((error) => {
                console.error("Error getting documents: ", error);
            });

        // Call function to generate chart for this category
        generateCategoryChart(category, userId);
    } else {
        console.log("No user is signed in.");
    }
});

// Function to generate chart for selected category
async function generateCategoryChart(category, userId) {
    const ctx = document.getElementById("expensesChart").getContext("2d");

    // Firestore reference
    const db = firebase.firestore();
    const expensesRef = db.collection("expenses");

    // Fetch expenses only for the selected category and logged-in user
    const querySnapshot = await expensesRef
        .where("category", "==", category)
        .where("userId", "==", userId)
        .get();

    const data = {};

    querySnapshot.forEach((doc) => {
        const expense = doc.data();
        const date = new Date(expense.date);
        const month = date.toLocaleString("default", { month: "short" });

        if (!data[month]) {
            data[month] = 0;
        }

        data[month] += expense.amount; // Summing up expense amounts per month
    });

    // Format data for Chart.js
    const labels = Object.keys(data); // Months
    const dataset = {
        label: category+=" Trends", // Show only this category
        data: labels.map((month) => data[month] || 0),
        borderWidth: 2,
        backgroundColor: "rgba(0, 90, 0, 0.5)",
        
        borderColor: "#40a540",
        fill: false
    };

    // Create chart
    new Chart(ctx, {
        type: "line",
        data: { labels, datasets: [dataset] },
        options: {
            responsive: true,
            plugins: { 
                legend: { 
                    labels: { 
                        color: "#005a00", // Change legend text color
                        font: { weight: "bold", size: 15 } // Bold + Font size 14px
                    } 
                } 
            },
            scales: { 
                x: { 
                    ticks: { 
                        color: "#005a00", // Change X-axis text color
                        font: { weight: "bold"} // Bold + Font size 12px
                    },
                    title: { 
                        display: true, 
                        text: "Month", 
                        color: "#005a00", 
                        font: { weight: "bold" } // Bold + Font size 16px
                    } 
                },
                y: { 
                    ticks: { 
                        color: "#005a00", // Change Y-axis text color
                        font: { weight: "bold"} // Bold + Font size 12px
                    },
                    title: { 
                        display: true, 
                        text: "Total Spending ($)", 
                        color: "#005a00", 
                        font: { weight: "bold"} // Bold + Font size 16px
                    } 
                }
            }
        }
    });
}