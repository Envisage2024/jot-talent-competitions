const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const clientId = 'pay-caed774a-d7d0-4a74-b751-5b77be5b3911';
const clientSecret = 'IO-BdUCLRbm7xxYyz35WqpSu2QcPqrP3Eigg';
const walletId = 'a563af4c-3137-4085-a888-93bdf3fb29b4';

const app = express();
app.use(cors());
app.use(express.json());

async function getAccessToken() {
    const tokenUrl = 'https://id.iotec.io/connect/token';
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token error: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    return data.access_token;
}

async function pollPaymentStatus(transactionId, accessToken) {
    const url = `https://pay.iotec.io/api/collections/${transactionId}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        console.log(`Polling ${transactionId}: status ${data.status}, message ${data.statusMessage}`);
        return data;
    } catch (error) {
        console.error(`Error polling ${transactionId}:`, error);
        return null;
    }
}

async function getWalletBalance(accessToken) {
    const url = `https://pay.iotec.io/api/wallets/${walletId}/balance`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            console.error('Failed to get wallet balance:', response.status, response.statusText);
            try {
                const errorData = await response.json();
                console.error('Error data:', errorData); // Log the error data
            } catch (jsonError) {
                console.error('Failed to parse error data:', jsonError);
            }
            return null;
        }
        const data = await response.json();
        return data.availableBalance; // Adjust based on the actual response structure
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        return null; // Or a default value indicating an error
    }
}

app.post('/pay', async (req, res) => {
    try {
        const { amount, method, phone, bankAccount, bankCode, accountName } = req.body;
        if (!amount || !method) {
            return res.status(400).json({ message: 'Amount and payment method are required.' });
        }

        const accessToken = await getAccessToken();

        if (method === 'BankAccount') {
            if (!bankAccount || !bankCode || !accountName) {
                return res.status(400).json({ message: 'Bank account, code, and name required.' });
            }

            // Bank disbursement payload per swagger BankDisbursementRequest
            const disbursePayload = {
                walletId: walletId,
                amount: Number(amount),
                currency: 'UGX',
                externalId: '001',
                accountName: accountName,
                accountNumber: bankAccount,
                bankIdentificationCode: bankCode, // swagger uses bankIdentificationCode
                payeeNote: 'Bank transfer via ioTec API'
            };

            console.log('Outgoing bank-disburse payload:', JSON.stringify(disbursePayload, null, 2));

            const response = await fetch('https://pay.iotec.io/api/disbursements/bank-disburse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(disbursePayload)
            });

             if (!response.ok) {
                // Log the error response for debugging
                const errorData = await response.json();
                console.error('Bank disbursement failed:', response.status, response.statusText, errorData);
                let errorMessage = 'Bank disbursement failed';
                if (errorData && errorData.message) {
                    errorMessage += `: ${errorData.message}`;
                } else if (response.statusText) {
                    errorMessage += `: ${response.statusText}`;
                }
                return res.status(response.status).json({ message: errorMessage, error: errorData });
            }

            const data = await response.json();
            console.log('Bank disbursement successful:', response.status, data);
            return res.json(data);


        } else if (method === 'MobileMoney') {
            if (!phone) {
                return res.status(400).json({ message: 'Phone number is required for Mobile Money payments.' });
            }

            const collectPayload = {
                walletId: walletId,
                amount: Number(amount),
                currency: 'UGX',
                externalId: '001',
                payer: phone, // Use phone for mobile money
                payerNote: 'Mobile Money Payment via ioTec API',
                payeeNote: 'Thank you for your payment!'
            };

            console.log('Outgoing collect payload:', JSON.stringify(collectPayload, null, 2));

            const response = await fetch('https://pay.iotec.io/api/collections/collect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(collectPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Mobile Money collection failed:', response.status, response.statusText, errorData);
                return res.status(response.status).json({ message: 'Mobile Money collection failed', error: errorData });
            }

            const data = await response.json();
            console.log('Mobile Money collection successful:', response.status, data);
            return res.json(data);
        }

        return res.status(400).json({ message: 'Invalid payment method.' });
    } catch (error) {
        console.error("An error occurred:", error);
        return res.status(500).json({ message: error.message });
    }
});

app.listen(3000, () => console.log('Proxy running on port 3000'));