// Only declare db if it hasn't been declared yet
if (typeof db === 'undefined') {
    const db = firebase.firestore();
}

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loadLoanDetails();
    } else {
        // User is signed out
        window.location.href = 'login.html';
    }
});

function saveLoanDetails() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please log in to save loan details');
        window.location.href = 'login.html';
        return;
    }

    const startingAmount = document.getElementById('startingAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const monthlyPayment = document.getElementById('monthlyPayment').value;

    if (!startingAmount || !interestRate || !monthlyPayment) {
        alert('Please fill in all fields');
        return;
    }

    // Save to Firestore in studentLoans collection
    db.collection('studentLoans').doc(user.uid).set({
        startingAmount: parseFloat(startingAmount),
        interestRate: parseFloat(interestRate),
        monthlyPayment: parseFloat(monthlyPayment),
        startDate: new Date(),
        remainingAmount: parseFloat(startingAmount),
        totalInterestPaid: 0
    }).then(() => {
        alert('Loan details saved successfully!');
        updateStatus();
        loadPaymentHistory();
    }).catch((error) => {
        console.error('Error saving loan details: ', error);
        alert('Error saving loan details. Please try again.');
    });
}

// Load details from Firestore
function loadLoanDetails() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('studentLoans').doc(user.uid).get()
        .then((doc) => {
            if (doc && doc.data()) {
                const data = doc.data();
                document.getElementById('startingAmount').value = data.startingAmount || '';
                document.getElementById('interestRate').value = data.interestRate || '';
                document.getElementById('monthlyPayment').value = data.monthlyPayment || '';
                updateStatus();
                loadPaymentHistory();
            }
        }).catch((error) => {
            console.error('Error loading loan details: ', error);
        });
}

// Record a payment
function recordPayment() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please log in to record a payment');
        window.location.href = 'login.html';
        return;
    }

    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    if (!paymentAmount || paymentAmount <= 0) {
        alert('Please enter a valid payment amount');
        return;
    }

    // Get current loan details
    db.collection('studentLoans').doc(user.uid).get()
        .then((doc) => {
            if (!doc || !doc.data()) {
                alert('Please save loan details first');
                return;
            }

            const loanData = doc.data();
            const remainingAmount = loanData.remainingAmount - paymentAmount;
            const newTotalInterestPaid = loanData.totalInterestPaid + (loanData.remainingAmount * (loanData.interestRate / 100 / 12));

            // Update loan details
            db.collection('studentLoans').doc(user.uid).update({
                remainingAmount: remainingAmount,
                totalInterestPaid: newTotalInterestPaid
            });

            // Add payment to history
            return db.collection('studentLoans').doc(user.uid)
                .collection('payments').add({
                    amount: paymentAmount,
                    date: new Date(),
                    remainingBalance: remainingAmount
                });
        })
        .then(() => {
            document.getElementById('paymentAmount').value = '';
            updateStatus();
            loadPaymentHistory();
            alert('Payment recorded successfully!');
        })
        .catch((error) => {
            console.error('Error recording payment: ', error);
            alert('Error recording payment. Please try again.');
        });
}

// Load payment history
function loadPaymentHistory() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const paymentLog = document.getElementById('payment-log');
    paymentLog.innerHTML = `
        <div class="space-y-2">
            <div class="grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm font-medium border-b-2 border-[#005a00] pb-1 md:pb-2">
                <div class="text-left">Date</div>
                <div class="text-right">Payment</div>
                <div class="text-right">Balance</div>
            </div>
            <div id="payment-rows" class="space-y-2"></div>
        </div>
    `;

    db.collection('studentLoans').doc(user.uid)
        .collection('payments').orderBy('date', 'desc').get()
        .then((snapshot) => {
            const paymentRows = document.getElementById('payment-rows');
            snapshot.forEach((doc) => {
                const payment = doc.data();
                const date = payment.date.toDate().toLocaleDateString();
                const amount = payment.amount.toFixed(2);
                const balance = payment.remainingBalance.toFixed(2);

                const paymentRow = document.createElement('div');
                paymentRow.className = 'grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm py-2 bg-gray-50 rounded-lg';
                paymentRow.innerHTML = `
                    <div class="text-left truncate">${date}</div>
                    <div class="text-right">$${amount}</div>
                    <div class="text-right">$${balance}</div>
                `;
                paymentRows.appendChild(paymentRow);
            });
        })
        .catch((error) => {
            console.error('Error loading payment history: ', error);
        });
}

// Update the Status section based on loan details
function updateStatus() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('studentLoans').doc(user.uid).get()
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

// Event Listeners
document.getElementById('saveLoanDetails').addEventListener('click', saveLoanDetails);
document.getElementById('recordPayment').addEventListener('click', recordPayment);

// Load data when page loads
window.addEventListener('load', loadLoanDetails);