const database = firebase.database();

function saveLoanDetails() {
    const startingAmount = document.getElementById('startingAmount').value;
    const interestRate = document.getElementById('interestRate').value;
    const monthlyPayment = document.getElementById('monthlyPayment').value;

    database.ref('loanDetails').set({
        startingAmount: startingAmount,
        interestRate: interestRate,
        monthlyPayment: monthlyPayment
    }).then(() => {
        alert('Loan details saved successfully!');
        updateStatus();
    }).catch((error) => {
        console.error('Error saving loan details: ', error);
    });
}

// Load details from Firebase
function loadLoanDetails() {
    database.ref('loanDetails').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('startingAmount').value = data.startingAmount || '';
            document.getElementById('interestRate').value = data.interestRate || '';
            document.getElementById('monthlyPayment').value = data.monthlyPayment || '';
            updateStatus();
        }
    }).catch((error) => {
        console.error('Error loading loan details: ', error);
    });
}

// Update the Status section based on loan details
function updateStatus() {
    const startingAmount = parseFloat(document.getElementById('startingAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const monthlyPayment = parseFloat(document.getElementById('monthlyPayment').value) || 0;

    if (startingAmount <= 0 || monthlyPayment <= 0) return;

    // Calculate years until debt-free
    const totalMonths = startingAmount / monthlyPayment;
    const yearsUntilDebtFree = (totalMonths / 12).toFixed(1);
    document.getElementById('yearsUntilDebtFree').textContent = yearsUntilDebtFree;

    // Calculate total interest paid
    const totalInterestPaid = (startingAmount * (interestRate / 100)).toFixed(2);
    document.getElementById('totalInterestPaid').textContent = `$${totalInterestPaid}`;

    // Update progress percentage
    const progressPercentage = ((monthlyPayment / startingAmount) * 100).toFixed(1);
    document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;

    // Update average monthly payment
    document.getElementById('averageMonthlyPayment').textContent = `$${monthlyPayment}`;
}

document.getElementById('saveLoanDetails').addEventListener('click', saveLoanDetails);

window.addEventListener('load', loadLoanDetails);