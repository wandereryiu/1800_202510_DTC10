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
        const date = document.getElementById('expenseDate').value;
        const category = document.getElementById('expenseCategory').value;
        const description = document.getElementById('expenseDescription').value;

        // Basic validation
        if (!amount || !date || !category || !description) {
            alert('Please fill in all fields');
            return;
        }

        // Add to Firestore
        await db.collection('expenses').add({
            userId: currentUser.uid,
            amount: parseFloat(amount),
            date: date,
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
                            <p class="text-xs text-gray-500">${expense.date}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <p class="font-bold">$${expense.amount.toFixed(2)}</p>
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

// Set default date to today
document.addEventListener('DOMContentLoaded', function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
});

// Expense deletion
async function deleteExpense(expenseId) {
    try {
        if (!currentUser) {
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