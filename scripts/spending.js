// Initialize variables to store user data
let currentUser;

// Wait for authentication
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        loadExpenses();
    } else {
        console.log("No user is signed in");
        window.location.href = 'login.html'; // Redirect to login if not authenticated
    }
});

// Get form element
const expenseForm = document.getElementById('expenseForm');

expenseForm.addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission

    try {
        // Check authentication first
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Get form values
        const amount = document.getElementById('expenseAmount').value;
        const category = document.getElementById('expenseCategory').value;
        const description = document.getElementById('expenseDescription').value;

        // Basic validation
        if (!amount || !category || !description) {
            alert('Please fill in all fields');
            return;
        }

        // Add to Firestore
        await db.collection('expenses').add({
            userId: currentUser.uid,
            amount: parseFloat(amount),
            category: category,
            description: description,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear form
        expenseForm.reset();
        loadExpenses(); // Refresh the expenses list

    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Error adding expense: ' + error.message);
    }
});

// Function to load and display expenses
async function loadExpenses() {
    try {
        if (!currentUser) return;

        // Show loading state
        const expensesList = document.getElementById('expensesList');
        expensesList.innerHTML = '<p class="text-gray-500">Loading expenses...</p>';

        // Get expenses without ordering
        const expensesRef = db.collection('expenses').where('userId', '==', currentUser.uid);
        const snapshot = await expensesRef.get();
        expensesList.innerHTML = '';

        let monthlyTotal = 0;
        let expenses = [];

        if (snapshot.empty) {
            expensesList.innerHTML = '<p class="text-gray-500">No expenses found</p>';
            document.getElementById('monthlyTotal').textContent = 'Total: $0.00';
            return;
        }

        // Collect all expenses
        snapshot.forEach((doc) => {
            const expense = doc.data();
            expenses.push({
                ...expense,
                id: doc.id
            });
            monthlyTotal += expense.amount;
        });

        // Sort expenses by timestamp (most recent first)
        expenses.sort((a, b) => {
            return (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0);
        });

        // Display expenses
        expenses.forEach((expense) => {
            expensesList.innerHTML += `
                <div class="p-3 bg-gray-50 rounded-md">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-semibold">${expense.description}</p>
                            <p class="text-sm text-gray-600">${expense.category}</p>
                        </div>
                        <p class="font-bold">$${expense.amount.toFixed(2)}</p>
                    </div>
                </div>
            `;
        });

        // Update monthly total
        document.getElementById('monthlyTotal').textContent = `Total: $${monthlyTotal.toFixed(2)}`;

    } catch (error) {
        console.error('Error loading expenses:', error);
        expensesList.innerHTML = '<p class="text-red-500">Error loading expenses. Please try again later.</p>';
    }
}

// Format currency input (optional enhancement)
document.getElementById("expenseAmount").addEventListener("input", function (e) {
    let value = e.target.value;
    if (value !== "") {
        value = parseFloat(value);
        if (!isNaN(value)) {
            e.target.value = value.toFixed(2);
        }
    }
}); 