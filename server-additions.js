// Add these sections to the end of your server.js file (before the closing comments)

// ============================================================
// WEBHOOK: ioTech Payment Status Updates
// ============================================================
// Configure this URL in your ioTech dashboard to receive payment updates
app.post('/webhook/iotec-payment-status', async (req, res) => {
    try {
        console.log('📨 ioTech Webhook Received:', req.body);
        
        const { transactionId, status, statusMessage, amount, phone } = req.body;
        
        if (!transactionId) {
            return res.status(400).json({ 
                success: false,
                message: 'Transaction ID is required in webhook' 
            });
        }
        
        // Normalize status from ioTech format to our format
        const normalizedStatus = status ? status.toUpperCase() : 'UNKNOWN';
        const validStatuses = ['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED'];
        
        if (!validStatuses.includes(normalizedStatus)) {
            console.warn('⚠️ Unknown status received from ioTech:', status);
        }
        
        // Update Firestore with the status from ioTech
        await db.collection('payments').doc(transactionId).update({
            status: normalizedStatus,
            statusMessage: statusMessage || `Status updated by ioTech: ${status}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            webhookReceivedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Firestore updated via webhook:', {
            transactionId: transactionId,
            status: normalizedStatus
        });
        
        // If payment successful, send email notification
        if (normalizedStatus === 'SUCCESS') {
            try {
                const paymentDoc = await db.collection('payments').doc(transactionId).get();
                if (paymentDoc.exists) {
                    const payment = paymentDoc.data();
                    // Call email function (defined below)
                    await sendPaymentSuccessEmail(payment.email, payment);
                }
            } catch (emailError) {
                console.error('Error sending success email:', emailError);
                // Don't fail the webhook response if email fails
            }
        }
        
        // Return success to ioTech
        return res.json({ 
            success: true, 
            message: 'Webhook processed successfully',
            transactionId: transactionId
        });
        
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing webhook',
            error: error.message 
        });
    }
});

// ============================================================
// EMAIL NOTIFICATIONS
// ============================================================
// Helper function to send payment success email
async function sendPaymentSuccessEmail(recipientEmail, paymentData) {
    try {
        console.log('📧 Sending success email to:', recipientEmail);
        
        // For now, log the email that would be sent
        // In production, integrate with Sendgrid, Mailgun, or Firebase Email Extension
        const emailContent = {
            to: recipientEmail,
            subject: '✅ Payment Successful - Competition Entry Confirmed',
            html: `
                <h2>Payment Successful!</h2>
                <p>Hello,</p>
                <p>Your payment for the competition entry has been successfully processed.</p>
                
                <h3>Payment Details:</h3>
                <ul>
                    <li><strong>Transaction ID:</strong> ${paymentData.transactionId}</li>
                    <li><strong>Amount:</strong> ${paymentData.amount.toLocaleString()} ${paymentData.currency}</li>
                    <li><strong>Phone:</strong> ${paymentData.phone}</li>
                    <li><strong>Status:</strong> ${paymentData.status}</li>
                </ul>
                
                <p>Your competition entry is now confirmed. Thank you for joining!</p>
                <p>Best of luck in the competition!</p>
            `
        };
        
        // TODO: Uncomment and configure your email service
        // Example with Sendgrid:
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // await sgMail.send(emailContent);
        
        console.log('✅ Email prepared (not sent - configure email service):', emailContent);
        
    } catch (error) {
        console.error('Error preparing email:', error);
        throw error;
    }
}

// Helper function to send payment failed email
async function sendPaymentFailedEmail(recipientEmail, paymentData, reason) {
    try {
        console.log('📧 Sending failure email to:', recipientEmail);
        
        const emailContent = {
            to: recipientEmail,
            subject: '❌ Payment Failed - Please Retry',
            html: `
                <h2>Payment Failed</h2>
                <p>Hello,</p>
                <p>Unfortunately, your payment could not be processed.</p>
                
                <h3>Payment Details:</h3>
                <ul>
                    <li><strong>Transaction ID:</strong> ${paymentData.transactionId}</li>
                    <li><strong>Amount:</strong> ${paymentData.amount.toLocaleString()} ${paymentData.currency}</li>
                    <li><strong>Phone:</strong> ${paymentData.phone}</li>
                    <li><strong>Reason:</strong> ${reason}</li>
                </ul>
                
                <p><strong>What to do next:</strong></p>
                <ul>
                    <li>Check that your mobile money account has sufficient funds</li>
                    <li>Verify your phone number is correct</li>
                    <li>Try again in a few moments</li>
                </ul>
                
                <p>If you continue to experience issues, please contact support.</p>
            `
        };
        
        console.log('✅ Failure email prepared (not sent - configure email service):', emailContent);
        
    } catch (error) {
        console.error('Error preparing failure email:', error);
        throw error;
    }
}

// ============================================================
// SERVER STARTUP
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Payment server running on port ${PORT}`);
    console.log(`📱 Firebase-backed payment system ACTIVE`);
    console.log(`\n✅ Available Endpoints:`);
    console.log(`   - POST /process-payment (payment initiation)`);
    console.log(`   - POST /check-payment-status-firebase (Firebase payment check)`);
    console.log(`   - POST /admin/update-payment-status (manual status update)`);
    console.log(`   - POST /user-payments (user payment history)`);
    console.log(`   - POST /webhook/iotec-payment-status (ioTech webhook)`);
    console.log(`   - GET  /health (health check)`);
    console.log(`\n📖 Firebase Collection: payments`);
    console.log(`   Firestore is the source of truth for all payment statuses`);
    console.log(`\nLocal access: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
});

// Function to get local IP address
function getIPAddress() {
    const interfaces = require('os').networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

console.log('✅ Payment server initialized and ready');
