let categoryChart; // Store chart instance globally

firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        currentUser = user;
        await updateCategoryChart();
    } else {
        console.log("No user signed in");
        window.location.href = "login.html"; // Redirect if not authenticated
    }
});

// Function to fetch and update category-wise expenses chart
async function updateCategoryChart() {
    if (!currentUser) return;

    try {
        const expensesRef = db.collection("expenses").where("userId", "==", currentUser.uid);
        const snapshot = await expensesRef.get();

        let categoryTotals = {};
        snapshot.forEach((doc) => {
            const expense = doc.data();
            if (expense.category && expense.amount) {
                categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
            }
        });

        // Prepare data for the chart
        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);
        const colors = [
            "#b91d47", "#00aba9", "#2b5797", "#f59176", "#ffff66", "#339966", "#ff9933"
        ].slice(0, categories.length); // Adjust color count

        // Destroy previous chart instance if exists
        if (categoryChart) {
            categoryChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById("myChart").getContext("2d");
        categoryChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: categories,
                datasets: [{
                    backgroundColor: colors,
                    data: amounts
                }]
            },
            options: {
                title: {
                    display: true,
                    text: "Expense Breakdown by Category"
                }
            }
        });

    } catch (error) {
        console.error("Error fetching expenses:", error);
    }
}