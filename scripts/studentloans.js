// Only declare db if it hasn't been declared yet
if (typeof db === 'undefined') {
    const db = firebase.firestore();
}

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loadAllLoans();
    } else {
        // User is signed out
        window.location.href = 'login.html';
    }
});

// Show custom confirmation dialog
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

// Show delete confirmation dialog
function showDeleteConfirmation(message, onConfirm) {
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
            <h3 class="text-lg font-bold text-[#005a00] mb-4">Delete Confirmation</h3>
            <p class="mb-6 text-gray-700">${message}</p>
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

    document.getElementById('confirm-delete').addEventListener('click', () => {
        confirmDialog.remove();
        onConfirm();
    });

    // Also close on backdrop click
    confirmDialog.querySelector('.fixed.inset-0.bg-black').addEventListener('click', () => {
        confirmDialog.remove();
    });
}

function saveLoanDetails() {
    const user = firebase.auth().currentUser;
    if (!user) {
        showConfirmationDialog('Please log in to save loan details', 'Error');
        window.location.href = 'login.html';
        return;
    }

    const title = document.getElementById('loanTitle').value;
    const startingAmount = document.getElementById('startingAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const monthlyPayment = document.getElementById('monthlyPayment').value;

    if (!title || !startingAmount || !interestRate || !monthlyPayment) {
        showConfirmationDialog('Please fill in all fields', 'Error');
        return;
    }

    const now = new Date();
    // Save to Firestore in studentLoans collection
    const loanRef = db.collection('studentLoans').doc(user.uid).collection('loans').doc();
    loanRef.set({
        title: title,
        startingAmount: parseFloat(startingAmount),
        interestRate: parseFloat(interestRate),
        monthlyPayment: parseFloat(monthlyPayment),
        startDate: now,
        lastInterestDate: now,
        remainingAmount: parseFloat(startingAmount),
        totalInterestPaid: 0
    }).then(() => {
        // Clear the form
        document.getElementById('loanTitle').value = '';
        document.getElementById('startingAmount').value = '';
        document.getElementById('interestRate').value = '';
        document.getElementById('monthlyPayment').value = '';

        // Show success message
        showConfirmationDialog('Loan details saved successfully!', 'Success');

        // Refresh the loan dropdown and select the new loan
        loadAllLoans().then(() => {
            const loanSelect = document.getElementById('selectedLoan');
            loanSelect.value = loanRef.id;
            updateStatus(loanRef.id);
            loadPaymentHistory(loanRef.id);
        });
    }).catch((error) => {
        console.error('Error saving loan details: ', error);
        showConfirmationDialog('Error saving loan details. Please try again.', 'Error');
    });
}

// Load details from Firestore
function loadLoanDetails(loanId) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('studentLoans').doc(user.uid).collection('loans').doc(loanId).get()
        .then((doc) => {
            if (doc && doc.data()) {
                const data = doc.data();
                document.getElementById('loanTitle').value = data.title || '';
                document.getElementById('startingAmount').value = data.startingAmount || '';
                document.getElementById('interestRate').value = data.interestRate || '';
                document.getElementById('monthlyPayment').value = data.monthlyPayment || '';
                updateStatus(loanId);
                loadPaymentHistory(loanId);
            }
        }).catch((error) => {
            console.error('Error loading loan details: ', error);
        });
}

// Record a payment
function recordPayment() {
    const user = firebase.auth().currentUser;
    if (!user) {
        showConfirmationDialog('Please log in to record a payment', 'Error');
        window.location.href = 'login.html';
        return;
    }

    const selectedLoanId = document.getElementById('selectedLoan').value;
    if (!selectedLoanId) {
        showConfirmationDialog('Please select a loan first', 'Error');
        return;
    }

    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    // Convert input date to start of day in local timezone
    const paymentDate = new Date(document.getElementById('paymentDate').value + 'T00:00:00');

    if (!paymentAmount || paymentAmount <= 0) {
        showConfirmationDialog('Please enter a valid payment amount', 'Error');
        return;
    }

    if (!paymentDate || isNaN(paymentDate.getTime())) {
        showConfirmationDialog('Please enter a valid payment date', 'Error');
        return;
    }

    // Get current loan details
    const loanRef = db.collection('studentLoans').doc(user.uid).collection('loans').doc(selectedLoanId);

    // Start a transaction to ensure data consistency
    return db.runTransaction((transaction) => {
        return transaction.get(loanRef).then((doc) => {
            if (!doc.exists) {
                throw "Loan does not exist!";
            }

            const loanData = doc.data();
            const lastInterestDate = loanData.lastInterestDate.toDate();

            // Convert both dates to start of day for comparison
            const lastInterestStartOfDay = new Date(lastInterestDate.getFullYear(), lastInterestDate.getMonth(), lastInterestDate.getDate());
            const paymentStartOfDay = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());

            // Calculate days between dates (will be 0 for same day)
            const daysSinceLastInterest = Math.max(0, (paymentStartOfDay - lastInterestStartOfDay) / (1000 * 60 * 60 * 24));

            // Calculate interest for the elapsed time
            const dailyInterestRate = loanData.interestRate / 100 / 365;
            const interestAccrued = loanData.remainingAmount * dailyInterestRate * daysSinceLastInterest;

            // Calculate how much of the payment goes to interest vs principal
            const interestPayment = Math.min(interestAccrued, paymentAmount);
            const principalPayment = paymentAmount - interestPayment;

            const newRemainingAmount = loanData.remainingAmount - principalPayment;
            // Add the interest payment to the existing total interest paid
            const newTotalInterestPaid = loanData.totalInterestPaid + interestPayment;

            // Validate the payment date isn't before the last interest date
            if (paymentStartOfDay < lastInterestStartOfDay) {
                throw "Payment date cannot be before the last recorded payment date";
            }

            // Update the loan document
            transaction.update(loanRef, {
                remainingAmount: newRemainingAmount,
                totalInterestPaid: newTotalInterestPaid,
                lastInterestDate: paymentStartOfDay
            });

            // Add the payment to history with server timestamp
            const paymentRef = loanRef.collection('payments').doc();
            transaction.set(paymentRef, {
                amount: paymentAmount,
                date: paymentStartOfDay,
                remainingBalance: newRemainingAmount,
                interestPaid: interestPayment,
                principalPaid: principalPayment,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                newRemainingAmount,
                newTotalInterestPaid
            };
        });
    })
        .then((result) => {
            document.getElementById('paymentAmount').value = '';
            // Reset payment date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('paymentDate').value = today;
            updateStatus(selectedLoanId);
            loadPaymentHistory(selectedLoanId);
            showConfirmationDialog('Payment recorded successfully!', 'Success');
        })
        .catch((error) => {
            console.error('Error recording payment: ', error);
            let errorMessage = error;
            if (error === "Payment date cannot be before the last recorded payment date") {
                errorMessage = "Payment date must be on or after the last recorded payment date";
            }
            showConfirmationDialog(errorMessage, 'Error');
        });
}

// Delete a payment
async function deletePayment(loanId, paymentId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        showConfirmationDialog('Please log in first', 'Error');
        return;
    }

    showDeleteConfirmation('Are you sure you want to delete this payment?', async () => {
        try {
            const loanRef = db.collection('studentLoans').doc(user.uid).collection('loans').doc(loanId);

            // Start a transaction to ensure data consistency
            await db.runTransaction(async (transaction) => {
                // Get the payment being deleted
                const paymentDoc = await transaction.get(loanRef.collection('payments').doc(paymentId));
                const paymentData = paymentDoc.data();

                // Get all payments for this loan
                const paymentsSnapshot = await loanRef.collection('payments')
                    .orderBy('date', 'desc')
                    .get();

                const payments = paymentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    dateObj: doc.data().date.toDate(),
                    timestampObj: doc.data().timestamp?.toDate() || new Date(0)
                }));

                // Sort payments by date and timestamp
                payments.sort((a, b) => {
                    const dateCompare = b.dateObj - a.dateObj;
                    if (dateCompare !== 0) return dateCompare;
                    return b.timestampObj - a.timestampObj;
                });

                // Find the payment date that should become the new lastInterestDate
                let newLastInterestDate = null;
                const deletedPaymentDate = paymentData.date.toDate();

                // If this was the only payment, revert to loan start date
                if (payments.length === 1) {
                    const loanDoc = await transaction.get(loanRef);
                    const loanData = loanDoc.data();
                    newLastInterestDate = loanData.startDate;
                } else {
                    // Find the most recent payment before the one being deleted
                    for (const payment of payments) {
                        if (payment.id !== paymentId) {
                            if (!newLastInterestDate || payment.dateObj > newLastInterestDate) {
                                newLastInterestDate = payment.dateObj;
                            }
                        }
                    }
                }

                // Get the loan data
                const loanDoc = await transaction.get(loanRef);
                const loanData = loanDoc.data();

                // Update the loan document
                transaction.update(loanRef, {
                    remainingAmount: loanData.remainingAmount + paymentData.principalPaid,
                    totalInterestPaid: loanData.totalInterestPaid - paymentData.interestPaid,
                    lastInterestDate: newLastInterestDate
                });

                // Delete the payment
                transaction.delete(loanRef.collection('payments').doc(paymentId));
            });

            // Refresh the display
            updateStatus(loanId);
            loadPaymentHistory(loanId);
            showConfirmationDialog('Payment deleted successfully!', 'Success');
        } catch (error) {
            console.error('Error deleting payment:', error);
            showConfirmationDialog('Error deleting payment. Please try again.', 'Error');
        }
    });
}

// Delete a loan
async function deleteLoan(loanId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        showConfirmationDialog('Please log in first', 'Error');
        return;
    }

    showDeleteConfirmation('Are you sure you want to delete this loan? This will delete all payment history associated with this loan.', async () => {
        try {
            const loanRef = db.collection('studentLoans').doc(user.uid).collection('loans').doc(loanId);

            // Delete all payments first
            const paymentsSnapshot = await loanRef.collection('payments').get();
            const batch = db.batch();
            paymentsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Delete the loan document
            await loanRef.delete();

            // Clear the form and refresh the display
            document.getElementById('loanTitle').value = '';
            document.getElementById('startingAmount').value = '';
            document.getElementById('interestRate').value = '';
            document.getElementById('monthlyPayment').value = '';

            // Refresh loans dropdown
            loadAllLoans();

            // Clear payment history
            document.getElementById('payment-log').innerHTML = '';

            showConfirmationDialog('Loan deleted successfully!', 'Success');
        } catch (error) {
            console.error('Error deleting loan:', error);
            showConfirmationDialog('Error deleting loan. Please try again.', 'Error');
        }
    });
}

// Load payment history
function loadPaymentHistory(loanId) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Clear existing payment history first
    const paymentLog = document.getElementById('payment-log');
    paymentLog.innerHTML = '';

    // Header for payment history
    paymentLog.innerHTML = `
        <div class="space-y-2">
            <div class="grid grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm font-medium border-b-2 border-[#005a00] pb-1 md:pb-2">
                <div class="text-left">Date</div>
                <div class="text-right">Payment</div>
                <div class="text-right">Balance</div>
                <div class="text-right">Action</div>
            </div>
            <div id="payment-rows" class="space-y-2"></div>
        </div>
    `;

    // Get the payment rows container
    const paymentRows = document.getElementById('payment-rows');
    paymentRows.innerHTML = ''; // Ensure it's empty

    // Note: This query requires a composite index. Create it in the Firebase Console:
    // Collection: payments
    // Fields to index: date (Descending), timestamp (Descending), __name__ (Descending)
    db.collection('studentLoans').doc(user.uid)
        .collection('loans').doc(loanId)
        .collection('payments')
        .orderBy('date', 'desc')
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                paymentRows.innerHTML = '<div class="text-center text-gray-500">No payments recorded yet</div>';
                return;
            }

            // Convert to array and sort by date and timestamp
            const payments = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                payments.push({
                    id: doc.id,
                    ...data,
                    dateObj: data.date.toDate(), // Convert to Date object for sorting
                    timestampObj: data.timestamp?.toDate() || new Date(0) // Handle missing timestamp
                });
            });

            // Sort by date and timestamp
            payments.sort((a, b) => {
                // First compare by date
                const dateCompare = b.dateObj - a.dateObj;
                if (dateCompare !== 0) return dateCompare;
                // If same date, compare by timestamp
                return b.timestampObj - a.timestampObj;
            });

            // Display sorted payments
            payments.forEach((payment) => {
                const date = payment.dateObj.toLocaleDateString();
                const amount = payment.amount.toFixed(2);
                const balance = payment.remainingBalance.toFixed(2);

                const paymentRow = document.createElement('div');
                paymentRow.className = 'grid grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm py-2 bg-gray-50 rounded-lg';
                paymentRow.innerHTML = `
                    <div class="text-left truncate">${date}</div>
                    <div class="text-right">$${amount}</div>
                    <div class="text-right">$${balance}</div>
                    <div class="text-right">
                        <button onclick="deletePayment('${loanId}', '${payment.id}')" 
                            class="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                paymentRows.appendChild(paymentRow);
            });
        })
        .catch((error) => {
            console.error('Error loading payment history:', error);
            paymentRows.innerHTML = '<div class="text-center text-red-500">Error loading payment history. Please create the required index in Firebase Console.</div>';
        });
}

// Update the Status section based on loan details
function updateStatus(loanId) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('studentLoans').doc(user.uid)
        .collection('loans').doc(loanId).get()
        .then((doc) => {
            if (!doc || !doc.data()) return;

            const data = doc.data();
            const startingAmount = data.startingAmount;
            const monthlyPayment = data.monthlyPayment;
            const remainingAmount = data.remainingAmount;
            const totalInterestPaid = data.totalInterestPaid;

            // Calculate years until debt-free
            const totalMonths = remainingAmount / monthlyPayment;
            const yearsUntilDebtFree = (totalMonths / 12).toFixed(1);
            document.getElementById('yearsUntilDebtFree').textContent = yearsUntilDebtFree;

            // Update total interest paid
            document.getElementById('totalInterestPaid').textContent = `$${totalInterestPaid.toFixed(2)}`;

            // Update progress percentage
            const progressPercentage = (((startingAmount - remainingAmount) / startingAmount) * 100).toFixed(1);
            document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;

            // Update average monthly payment
            document.getElementById('averageMonthlyPayment').textContent = `$${monthlyPayment.toFixed(2)}`;

            // Update dates
            document.getElementById('startDate').textContent = data.startDate.toDate().toLocaleDateString();

            // Calculate expected payoff date
            const expectedPayoffDate = new Date(data.startDate.toDate());
            expectedPayoffDate.setMonth(expectedPayoffDate.getMonth() + Math.ceil(totalMonths));
            document.getElementById('expectedPayoffDate').textContent = expectedPayoffDate.toLocaleDateString();
        })
        .catch((error) => {
            console.error('Error updating status: ', error);
        });
}

// Load all loans for the current user
function loadAllLoans() {
    const user = firebase.auth().currentUser;
    if (!user) return Promise.reject('No user logged in');

    const loanSelect = document.getElementById('selectedLoan');
    const quickLoanSelect = document.getElementById('quickLoanSelect');
    loanSelect.innerHTML = '<option value="">Select a loan</option>';
    quickLoanSelect.innerHTML = '<option value="">Select a loan</option>';

    return db.collection('studentLoans').doc(user.uid)
        .collection('loans').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const loan = doc.data();
                // Add to payment section selector
                const option1 = document.createElement('option');
                option1.value = doc.id;
                option1.textContent = loan.title;
                loanSelect.appendChild(option1);

                // Add to quick selector
                const option2 = document.createElement('option');
                option2.value = doc.id;
                option2.textContent = loan.title;
                quickLoanSelect.appendChild(option2);
            });
        })
        .catch((error) => {
            console.error('Error loading loans: ', error);
        });
}

// Function to sync loan selection
function syncLoanSelectors(sourceId, targetId) {
    const sourceSelect = document.getElementById(sourceId);
    const targetSelect = document.getElementById(targetId);
    targetSelect.value = sourceSelect.value;

    // Trigger change event on the target
    const event = new Event('change');
    targetSelect.dispatchEvent(event);
}

// Event Listeners
document.getElementById('saveLoanDetails').addEventListener('click', saveLoanDetails);
document.getElementById('recordPayment').addEventListener('click', recordPayment);

// Handle loan selection changes
document.getElementById('selectedLoan').addEventListener('change', (e) => {
    const deleteLoanBtn = document.getElementById('deleteLoanBtn');
    if (e.target.value) {
        loadLoanDetails(e.target.value);
        deleteLoanBtn.disabled = false;
        // Sync with quick selector
        syncLoanSelectors('selectedLoan', 'quickLoanSelect');
    } else {
        deleteLoanBtn.disabled = true;
        // Sync with quick selector
        syncLoanSelectors('selectedLoan', 'quickLoanSelect');
    }
});

// Handle quick loan selection changes
document.getElementById('quickLoanSelect').addEventListener('change', (e) => {
    // Sync with payment section selector
    syncLoanSelectors('quickLoanSelect', 'selectedLoan');
});

// Load data when page loads
window.addEventListener('load', () => {
    loadAllLoans();
    // Disable delete loan button initially
    document.getElementById('deleteLoanBtn').disabled = true;
    // Set default payment date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('paymentDate').value = today;
});