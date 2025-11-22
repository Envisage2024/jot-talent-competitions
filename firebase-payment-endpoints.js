// Firebase-based Payment Verification Endpoints
// Add these endpoints to your server.js after the existing /payment-status endpoint
// These endpoints make Firebase Firestore the source of truth for payment status

// Firebase-only payment verification endpoint
app.post('/check-payment-status-firebase', async (req, res) => {
    try {
        const { transactionId } = req.body;
        
        if (!transactionId) {
            return res.status(400).json({ 
                success: false,
                message: 'Transaction ID is required.' 
            });
        }
        
        console.log('🔍 Checking payment status in Firebase:', transactionId);
        
        // Check Firestore for the transaction
        const paymentDoc = await db.collection('payments').doc(transactionId).get();
        
        if (!paymentDoc.exists) {
            console.log('❌ Transaction not found in Firebase:', transactionId);
            return res.status(404).json({ 
                success: false,
                paymentStatus: 'NOT_FOUND',
                message: 'Transaction not found',
                transactionId: transactionId
            });
        }
        
        const paymentData = paymentDoc.data();
        console.log('✅ Transaction found in Firebase:', {
            transactionId: transactionId,
            status: paymentData.status,
            amount: paymentData.amount,
            email: paymentData.email
        });
        
        // Return the Firebase data directly (source of truth)
        return res.json({
            success: true,
            paymentStatus: paymentData.status,
            ...paymentData,
            source: 'firebase'
        });
        
    } catch (error) {
        console.error('Error checking payment status in Firebase:', error);
        res.status(500).json({ 
            success: false,
            paymentStatus: 'ERROR',
            message: 'Error checking payment status',
            error: error.message 
        });
    }
});

// Manual payment status override endpoint - for admin/support use
app.post('/admin/update-payment-status', verifyIdToken, async (req, res) => {
    try {
        const { transactionId, status, statusMessage } = req.body;
        
        if (!transactionId || !status) {
            return res.status(400).json({ 
                success: false,
                message: 'Transaction ID and status are required.' 
            });
        }
        
        // Validate status
        const validStatuses = ['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({ 
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        console.log(`🔄 Admin updating payment status:`, {
            transactionId: transactionId,
            newStatus: status,
            adminUser: req.auth.email
        });
        
        // Update the payment record in Firestore
        await db.collection('payments').doc(transactionId).update({
            status: status.toUpperCase(),
            statusMessage: statusMessage || `Status updated to ${status}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            manuallyUpdatedBy: req.auth.email,
            manuallyUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Payment status updated in Firebase:', transactionId);
        
        return res.json({
            success: true,
            message: 'Payment status updated successfully',
            transactionId: transactionId,
            newStatus: status.toUpperCase()
        });
        
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating payment status',
            error: error.message 
        });
    }
});

// Get all payments for a specific email (for user history)
app.post('/user-payments', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required.' 
            });
        }
        
        console.log('🔍 Fetching payment history for:', email);
        
        // Query Firestore for payments by email
        const snapshot = await db.collection('payments')
            .where('email', '==', email)
            .orderBy('createdAt', 'desc')
            .get();
        
        const payments = [];
        snapshot.forEach(doc => {
            payments.push({
                transactionId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Found ${payments.length} payments for ${email}`);
        
        return res.json({
            success: true,
            email: email,
            paymentCount: payments.length,
            payments: payments
        });
        
    } catch (error) {
        console.error('Error fetching user payments:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching payment history',
            error: error.message 
        });
    }
});
