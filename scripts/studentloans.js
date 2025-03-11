function calculateStudentLoansPayoffTime(loanAmount, annualInterestRate, monthlyPayment) {
    let remainingBalance = loanAmount;
    let monthlyInterestRate = annualInterestRate / 100 / 12;
    let months = 0;

    if (monthlyPayment <= remainingBalance * monthlyInterestRate) {
        return "Your monthly payment is too low to pay off the loan.";
    }

    while (remainingBalance > 0) {
        let interest = remainingBalance * monthlyInterestRate;
        remainingBalance += interest;
        remainingBalance -= monthlyPayment;
        months++;

        // Prevent infinite loop
        if (months > 1000) {
            return "The loan will not be paid off with the current payment plan.";
        }
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return `It will take ${years} years and ${remainingMonths} months to pay off the loan.`;
}


async function saveToFirestore(loanAmount, interestRate, monthlyPayment, result) {
    try {
        await db.collection("loanCalculations").add({
            loanAmount: loanAmount,
            interestRate: interestRate,
            monthlyPayment: monthlyPayment,
            result: result,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Data saved to Firestore!");
    } catch (error) {
        console.error("Error saving to Firestore: ", error);
    }
}

document.getElementById('loanForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const monthlyPayment = parseFloat(document.getElementById('monthlyPayment').value);

    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(monthlyPayment)) {
        document.getElementById('result').textContent = "Please enter valid numbers.";
        return;
    }

    const result = calculatePayoffTime(loanAmount, interestRate, monthlyPayment);
    document.getElementById('result').textContent = result;

    await saveToFirestore(loanAmount, interestRate, monthlyPayment, result);
});