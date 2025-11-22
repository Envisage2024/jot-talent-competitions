// firebase-payment-realtime.js
// Add this to your join.html to enable real-time payment status updates
// Include this in your <script> tags or as a separate file

/**
 * Real-Time Payment Status Listener
 * Listens to Firestore changes and updates UI immediately when payment status changes
 * 
 * Usage:
 * const listener = startPaymentListener(transactionId, {
 *     onSuccess: () => { // Handle success },
 *     onFailed: () => { // Handle failed },
 *     onPending: () => { // Handle pending }
 * });
 * 
 * // Later, stop listening:
 * listener.unsubscribe();
 */

function startPaymentListener(transactionId, callbacks = {}) {
    console.log('👂 Starting real-time payment listener for:', transactionId);
    
    // Check if Firebase is initialized
    if (!db || typeof db === 'undefined') {
        console.error('Firebase Firestore not initialized');
        return null;
    }
    
    // Default callbacks
    const {
        onSuccess = () => {},
        onFailed = () => {},
        onPending = () => {},
        onChange = () => {}
    } = callbacks;
    
    // Set up real-time listener
    const unsubscribe = db.collection('payments').doc(transactionId)
        .onSnapshot(
            (doc) => {
                if (!doc.exists) {
                    console.warn('⚠️ Payment document not found:', transactionId);
                    return;
                }
                
                const paymentData = doc.data();
                console.log('🔄 Payment status updated:', {
                    transactionId: transactionId,
                    status: paymentData.status,
                    timestamp: new Date()
                });
                
                // Call generic change handler
                onChange(paymentData);
                
                // Call specific status handler
                switch (paymentData.status) {
                    case 'SUCCESS':
                        console.log('✅ Payment confirmed - status SUCCESS');
                        onSuccess(paymentData);
                        break;
                    case 'FAILED':
                        console.log('❌ Payment failed');
                        onFailed(paymentData);
                        break;
                    case 'PENDING':
                        console.log('⏳ Payment pending');
                        onPending(paymentData);
                        break;
                    default:
                        console.log('❓ Unknown payment status:', paymentData.status);
                }
            },
            (error) => {
                console.error('❌ Error listening to payment changes:', error);
            }
        );
    
    // Return object with unsubscribe function
    return {
        unsubscribe: unsubscribe,
        transactionId: transactionId
    };
}

/**
 * Enhanced Payment Status Poller with Firebase fallback
 * 
 * Usage:
 * const poller = createPaymentPoller(transactionId, {
 *     interval: 5000,  // Poll every 5 seconds
 *     maxPolls: 12,    // Stop after 60 seconds
 *     useRealtime: true // Use Firestore real-time first, then fall back to polling
 * });
 */

function createPaymentPoller(transactionId, options = {}) {
    const {
        interval = 5000,
        maxPolls = 12,
        useRealtime = true,
        onSuccess = () => {},
        onFailed = () => {},
        onTimeout = () => {}
    } = options;
    
    let pollCount = 0;
    let pollInterval = null;
    let realtimeListener = null;
    
    console.log('🔍 Creating payment poller:', {
        transactionId,
        interval,
        maxPolls,
        useRealtime
    });
    
    // If Firestore available, use real-time listener
    if (useRealtime && db) {
        realtimeListener = startPaymentListener(transactionId, {
            onSuccess: (data) => {
                console.log('✅ Real-time: Payment successful');
                onSuccess(data);
                clearInterval(pollInterval);
            },
            onFailed: (data) => {
                console.log('❌ Real-time: Payment failed');
                onFailed(data);
                clearInterval(pollInterval);
            }
        });
    }
    
    // Also set up polling as fallback
    pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`📊 Poll #${pollCount}/${maxPolls} for ${transactionId}`);
        
        if (pollCount > maxPolls) {
            clearInterval(pollInterval);
            console.log('⏱️ Polling timeout reached');
            onTimeout();
            return;
        }
        
        try {
            // Use Firebase endpoint
            const response = await fetch(`${SERVER_URL}/check-payment-status-firebase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId })
            });
            
            const result = await response.json();
            console.log(`📥 Poll response (attempt ${pollCount}):`, result.paymentStatus);
            
            if (result.paymentStatus === 'SUCCESS') {
                clearInterval(pollInterval);
                console.log('✅ Payment confirmed via polling');
                onSuccess(result);
            } else if (result.paymentStatus === 'FAILED') {
                clearInterval(pollInterval);
                console.log('❌ Payment failed via polling');
                onFailed(result);
            }
        } catch (error) {
            console.error('Error polling payment status:', error);
        }
    }, interval);
    
    // Return control object
    return {
        stop: () => {
            clearInterval(pollInterval);
            if (realtimeListener) {
                realtimeListener.unsubscribe();
            }
            console.log('🛑 Payment poller stopped');
        },
        status: () => ({
            pollCount,
            isRunning: pollInterval !== null
        })
    };
}

/**
 * Alternative: Use Firebase Realtime Database instead of Firestore
 * (if you migrate to RTDB in the future)
 */

function startPaymentRealtimeDBListener(transactionId, callbacks = {}) {
    console.log('👂 Starting RTDB listener for:', transactionId);
    
    // Check if Firebase Realtime Database is available
    if (!database) return null; // 'database' would be firebase.database()
    
    const ref = database.ref(`payments/${transactionId}`);
    
    ref.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            console.warn('Payment not found in RTDB');
            return;
        }
        
        const payment = snapshot.val();
        console.log('RTDB Payment data:', payment);
        
        if (callbacks.onChange) callbacks.onChange(payment);
        
        if (payment.status === 'SUCCESS' && callbacks.onSuccess) {
            callbacks.onSuccess(payment);
        } else if (payment.status === 'FAILED' && callbacks.onFailed) {
            callbacks.onFailed(payment);
        }
    });
    
    // Return function to stop listening
    return () => ref.off();
}
