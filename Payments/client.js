const paymentForm = document.getElementById('payment-form');
const paymentStatus = document.getElementById('payment-status');
const amountType = document.getElementById('amount-type');
const amountInput = document.getElementById('amount');

// Set your early bird deadline here (YYYY-MM-DDTHH:MM:SS format)
const earlyBirdDeadline = new Date('2025-09-09T19:20:00'); // Example: September 10, 2025, 11:59 PM

amountType.addEventListener('change', () => {
    amountInput.value = amountType.value;
});

paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = amountInput.value;
    const phone = document.getElementById('phone').value;
    const method = 'MobileMoney';

    // Validate input
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        paymentStatus.textContent = 'Please select a valid amount.';
        paymentStatus.style.color = 'red';
        return;
    }
    if (!phone) {
        paymentStatus.textContent = 'Please enter a phone number.';
        paymentStatus.style.color = 'red';
        return;
    }

    paymentStatus.textContent = 'Processing payment...';
    paymentStatus.style.color = 'orange';

    try {
        const response = await fetch('http://localhost:3000/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Number(amount), method, phone })
        });
        const data = await response.json();

        if (!response.ok) {
            paymentStatus.textContent = `Payment failed: ${data.message || 'Unknown error.'}`;
            paymentStatus.style.color = 'red';
            return;
        }

        handlePaymentStatus(data);
    } catch (error) {
        paymentStatus.textContent = `An error occurred: ${error.message}`;
        paymentStatus.style.color = 'red';
    }
});

function handlePaymentStatus(data) {
    const status = (data.status || '').toUpperCase();
    if (status === 'SUCCESS' || status === 'SUCCESSFUL') {
        paymentStatus.textContent = `Payment successful! Transaction ID: ${data.transactionId || ''}`;
        paymentStatus.style.color = 'green';
    } else if (status === 'PENDING') {
        paymentStatus.textContent = 'Payment initiated. Please check your phone to approve. Waiting for confirmation...';
        paymentStatus.style.color = 'blue';
        if (data.transactionId) pollStatus(data.transactionId);
    } else if (status === 'FAILED') {
        paymentStatus.textContent = `Payment failed: ${data.statusMessage || 'Transaction could not be completed.'}`;
        paymentStatus.style.color = 'red';
    } else {
        paymentStatus.textContent = `Payment status: ${data.status || 'Unknown'}. Transaction ID: ${data.transactionId || ''}`;
        paymentStatus.style.color = 'orange';
    }
}

function pollStatus(transactionId) {
    let pollCount = 0;
    const interval = setInterval(async () => {
        pollCount++;
        if (pollCount > 24) { // Stop after 2 minutes
            clearInterval(interval);
            paymentStatus.innerHTML = 'Payment confirmation timed out. <button id="retry-status">Check Status Again</button>';
            paymentStatus.style.color = 'red';
            document.getElementById('retry-status').onclick = () => manualStatusCheck(transactionId);
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/status/${transactionId}`);
            if (!response.ok) {
                clearInterval(interval);
                paymentStatus.textContent = 'Failed to check payment status.';
                paymentStatus.style.color = 'red';
                return;
            }
            const data = await response.json();
            const status = (data.status || '').toUpperCase();
            if (status === 'SUCCESS' || status === 'SUCCESSFUL' || status === 'FAILED') {
                clearInterval(interval);
                handlePaymentStatus(data);
            }
        } catch (error) {
            clearInterval(interval);
            paymentStatus.textContent = `Error checking payment status: ${error.message}`;
            paymentStatus.style.color = 'red';
        }
    }, 5000); // Poll every 5 seconds
}

function manualStatusCheck(transactionId) {
    paymentStatus.textContent = 'Checking payment status...';
    paymentStatus.style.color = 'orange';
    fetch(`http://localhost:3000/status/${transactionId}`)
        .then(response => response.json())
        .then(data => handlePaymentStatus(data))
        .catch(error => {
            paymentStatus.textContent = `Error checking payment status: ${error.message}`;
            paymentStatus.style.color = 'red';
        });
}

window.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const earlyBirdOption = amountType.querySelector('option[value="9000"]');
    if (now > earlyBirdDeadline) {
        // Disable Early Bird after deadline
        earlyBirdOption.disabled = true;
        amountType.value = "10000";
        amountInput.value = "10000";
    }
});