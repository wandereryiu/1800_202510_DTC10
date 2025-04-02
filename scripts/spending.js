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
            showConfirmationDialog('Please login first', 'Error');
            window.location.href = 'login.html';
            return;
        }

        // Get form values
        const amountInput = document.getElementById('expenseAmount').value.trim();
        const date = document.getElementById('expenseDate').value;
        const category = document.getElementById('expenseCategory').value;
        const description = document.getElementById('expenseDescription').value;

        // Enhanced validation
        if (!amountInput || !date || !category || !description) {
            showConfirmationDialog('Please fill in all fields', 'Error');
            return;
        }

        // Validate amount is a proper number
        const amount = parseFloat(amountInput);
        if (isNaN(amount) || amount <= 0) {
            showConfirmationDialog('Please enter a valid positive number for amount', 'Error');
            return;
        }

        // Add to Firestore
        await db.collection('expenses').add({
            userId: currentUser.uid,
            amount: amount,
            date: date,
            category: category,
            description: description,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear form
        expenseForm.reset();
        loadExpenses(); // Refresh the expenses list
        showConfirmationDialog('Expense added successfully!', 'Success');

    } catch (error) {
        console.error('Error adding expense:', error);
        showConfirmationDialog('Error adding expense: ' + error.message, 'Error');
    }
});

// Function to set default dates (today to 1 month ago)
function setDefaultDates() {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    document.getElementById('startDate').value = oneMonthAgo.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

// Function to format date for display
function formatDate(dateString) {
    // Create a date object by parsing parts to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    // Note: month is 0-indexed in JavaScript Date
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Function to format date for a more compact display
function formatDateCompact(dateString) {
    // Create a date object by parsing parts to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    // Note: month is 0-indexed in JavaScript Date
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Function to load and display expenses
async function loadExpenses() {
    try {
        if (!currentUser) return;

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        // Update date range display
        document.getElementById('dateRange').textContent =
            `Showing expenses from ${formatDate(startDate)} to ${formatDate(endDate)}`;

        // Show loading state
        const expensesList = document.getElementById('expensesList');
        expensesList.innerHTML = '<p class="text-gray-500">Loading expenses...</p>';

        // Get expenses
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

        // Collect and filter expenses by date
        snapshot.forEach((doc) => {
            const expense = doc.data();
            if (expense.date >= startDate && expense.date <= endDate) {
                expenses.push({
                    ...expense,
                    id: doc.id
                });
                monthlyTotal += expense.amount;
            }
        });

        // Sort expenses by date (most recent first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display expenses
        if (expenses.length === 0) {
            expensesList.innerHTML = '<p class="text-gray-500">No expenses found in selected date range</p>';
            document.getElementById('monthlyTotal').textContent = 'Total: $0.00';
            return;
        }

        expenses.forEach((expense, index) => {
            // Alternate background colors for better visual separation
            const bgColor = index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50';
            // Format date for display
            const formattedDate = formatDateCompact(expense.date);

            expensesList.innerHTML += `
                <div class="p-2 ${bgColor} rounded-md hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-500">${formattedDate}</span>
                            </div>
                            <p class="font-semibold text-[#005a00]">${expense.category}</p>
                            <p class="text-xs text-gray-600">${expense.description}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <p class="font-bold text-[#005a00]">$${expense.amount.toFixed(2)}</p>
                            <button onclick="deleteExpense('${expense.id}')" 
                                class="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        // After loading expenses and before displaying them
        if (!window.trendChart) {
            initializeCharts();
        }
        updateCharts(expenses);

    } catch (error) {
        console.error('Error loading expenses:', error);
        expensesList.innerHTML = '<p class="text-red-500">Error loading expenses. Please try again later.</p>';
    }
}

// Validate and format the amount input
document.getElementById("expenseAmount").addEventListener("input", function (e) {
    // Only allow digits and a single decimal point
    let value = e.target.value;
    let newValue = value.replace(/[^\d.]/g, ''); // Remove non-digits and non-decimal points

    // Ensure only one decimal point
    const decimalPoints = newValue.match(/\./g) || [];
    if (decimalPoints.length > 1) {
        newValue = newValue.substring(0, newValue.lastIndexOf('.'));
    }

    // Don't allow more than 2 decimal places
    if (newValue.includes('.')) {
        const parts = newValue.split('.');
        if (parts[1].length > 2) {
            newValue = parts[0] + '.' + parts[1].substring(0, 2);
        }
    }

    // Update the input value if it changed
    if (value !== newValue) {
        e.target.value = newValue;
    }
});

document.getElementById("expenseAmount").addEventListener("change", function (e) {
    // Format to 2 decimal places when the field loses focus
    let value = e.target.value.trim();
    if (value !== "") {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            e.target.value = numValue.toFixed(2);
        } else {
            // Clear invalid input
            e.target.value = "";
        }
    }
});

// Set default date to today
document.addEventListener('DOMContentLoaded', function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
});

// Create a custom confirmation dialog
function showDeleteConfirmation(expenseId) {
    // Check if a confirmation dialog already exists and remove it
    const existingConfirm = document.getElementById('custom-confirm-dialog');
    if (existingConfirm) {
        existingConfirm.remove();
    }

    // Create the confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.id = 'custom-confirm-dialog';
    confirmDialog.className = 'fixed inset-0 flex items-center justify-center z-50';
    confirmDialog.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="bg-white rounded-lg shadow-lg p-6 w-80 relative z-10 border-2 border-[#005a00]">
            <h3 class="text-lg font-bold text-[#005a00] mb-4">Delete Expense</h3>
            <p class="mb-6 text-gray-700">Are you sure you want to delete this expense?</p>
            <div class="flex justify-end space-x-3">
                <button id="cancel-delete" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                </button>
                <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Delete
                </button>
            </div>
        </div>
    `;

    // Add to body
    document.body.appendChild(confirmDialog);

    // Add event listeners
    document.getElementById('cancel-delete').addEventListener('click', () => {
        confirmDialog.remove();
    });

    document.getElementById('confirm-delete').addEventListener('click', async () => {
        confirmDialog.remove();
        try {
            await db.collection('expenses').doc(expenseId).delete();
            loadExpenses(); // Refresh the expenses list
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Error deleting expense: ' + error.message);
        }
    });

    // Also close on backdrop click
    confirmDialog.querySelector('.fixed.inset-0.bg-black').addEventListener('click', () => {
        confirmDialog.remove();
    });
}

// Expense deletion
async function deleteExpense(expenseId) {
    try {
        if (!currentUser) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // Show custom confirmation dialog instead of browser confirm
        showDeleteConfirmation(expenseId);

    } catch (error) {
        console.error('Error in delete process:', error);
        alert('Error processing delete: ' + error.message);
    }
}

// Add event listeners for date inputs
document.addEventListener('DOMContentLoaded', function () {
    setDefaultDates(); // Set initial date range

    // Add listeners for date changes
    document.getElementById('startDate').addEventListener('change', loadExpenses);
    document.getElementById('endDate').addEventListener('change', loadExpenses);
});

// Add these functions to create and update charts
function initializeCharts() {
    // Trend Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    window.trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Spending',
                data: [],
                borderColor: '#005a00',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    }
                }
            }
        }
    });
}

function updateCharts(expenses) {
    // Process data for trend chart
    const dailyData = {};
    expenses.forEach(expense => {
        const date = expense.date;
        dailyData[date] = (dailyData[date] || 0) + expense.amount;
    });

    // Sort dates
    const sortedDates = Object.keys(dailyData).sort();

    // Update trend chart
    window.trendChart.data.labels = sortedDates;
    window.trendChart.data.datasets[0].data = sortedDates.map(date => dailyData[date]);
    window.trendChart.update();
}

// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', function () {
    initializeCharts();
    // ... your existing DOMContentLoaded code ...
});

// Show confirmation dialog
function showConfirmationDialog(message, title = 'Success') {
    // Check if a confirmation dialog already exists and remove it
    const existingConfirm = document.getElementById('custom-confirm-dialog');
    if (existingConfirm) {
        existingConfirm.remove();
    }

    // Create the confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.id = 'custom-confirm-dialog';
    confirmDialog.className = 'fixed inset-0 flex items-center justify-center z-50';
    confirmDialog.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="bg-white rounded-lg shadow-lg p-6 w-80 relative z-10 border-2 border-[#005a00]">
            <h3 class="text-lg font-bold text-[#005a00] mb-4">${title}</h3>
            <p class="mb-6 text-gray-700">${message}</p>
            <div class="flex justify-end">
                <button id="confirm-ok" class="px-4 py-2 bg-[#005a00] text-white rounded-lg hover:bg-[#169416] transition-colors">
                    OK
                </button>
            </div>
        </div>
    `;

    // Add to body
    document.body.appendChild(confirmDialog);

    // Add event listeners
    document.getElementById('confirm-ok').addEventListener('click', () => {
        confirmDialog.remove();
    });

    // Also close on backdrop click
    confirmDialog.querySelector('.fixed.inset-0.bg-black').addEventListener('click', () => {
        confirmDialog.remove();
    });
} 