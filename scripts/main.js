// Initialize Firebase listeners when the page loads
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("User is logged in:", user.uid); // Debug log
            loadExpenses();
            displayUserName();
        } else {
            console.log("No user logged in"); // Debug log
            window.location.href = "index.html";
        }
    });
});

// Display user's name
function displayUserName() {
    const user = firebase.auth().currentUser;
    if (user) {
        db.collection("users").doc(user.uid).get()
            .then(userDoc => {
                if (userDoc.exists) {
                    const userName = userDoc.data().name;
                    document.getElementById("name-goes-here").innerHTML = userName || "Unknown User";
                } else {
                    console.error("User document does not exist");
                    document.getElementById("name-goes-here").innerHTML = "Unknown User";
                }
            })
            .catch(e => console.error("Error getting user name:", e));
    }
}


// Load and display expenses
function loadExpenses() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log("No user found in loadExpenses"); // Debug log
        return;
    }

    console.log("Loading expenses for user:", user.uid); // Debug log

    // Show loading state
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '<p class="text-gray-500 text-center">Loading expenses...</p>';

    // Read from Firestore
    db.collection('expenses')
        .where('userId', '==', user.uid)
        .get()
        .then((querySnapshot) => {
            console.log("Got expenses:", querySnapshot.size); // Debug log
            const expenses = [];
            querySnapshot.forEach((doc) => {
                expenses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort by timestamp
            expenses.sort((a, b) => b.timestamp - a.timestamp);

            // Take only the 5 most recent
            const recentExpenses = expenses.slice(0, 5);

            displayExpenses(recentExpenses);
            updateTotal(recentExpenses);
        })
        .catch((error) => {
            console.error("Error getting expenses:", error); // Debug log
            expensesList.innerHTML = '<p class="text-red-500 text-center">Error loading expenses</p>';
        });
}

// Display expenses in a formatted list
function displayExpenses(expenses) {
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '';

    if (expenses.length === 0) {
        expensesList.innerHTML = '<p class="text-gray-500 text-center">No expenses found</p>';
        return;
    }

    expenses.forEach((expense) => {
        expensesList.innerHTML += `
            <div class="p-3 bg-white rounded-md border border-[#005a00]">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-[#005a00]">${expense.description}</p>
                        <p class="text-sm text-gray-600">${expense.category}</p>
                        <p class="text-xs text-gray-500">${expense.date || 'No date'}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <p class="font-bold text-[#005a00]">$${expense.amount.toFixed(2)}</p>
                        <button onclick="deleteExpense('${expense.id}')" 
                            class="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Calculate and display total amount
function updateTotal(expenses) {
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
}

// Add the delete expense function
async function deleteExpense(expenseId) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Confirm before deleting
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        // Delete from Firestore
        await db.collection('expenses').doc(expenseId).delete();

        // Refresh the expenses list
        loadExpenses();

    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense: ' + error.message);
    }
}