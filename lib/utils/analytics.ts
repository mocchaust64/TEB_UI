/**
 * Send event to Google Analytics
 */
export const sendGAEvent = (
  eventName: string,
  eventParams?: {
    [key: string]: any;
  }
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics event sent:', eventName, eventParams);
    }
    return true;
  }
  return false;
};

/**
 * Get the correct Solscan URL based on network (mainnet/devnet)
 */
export const getSolscanUrl = (signature: string, cluster: string = 'mainnet-beta') => {
  if (cluster === 'devnet') {
    return `https://solscan.io/tx/${signature}?cluster=devnet`;
  }
  return `https://solscan.io/tx/${signature}`;
};

/**
 * Track account closure events
 */
export const trackAccountClosure = (
  success: boolean,
  data: {
    accountsClosed?: number;
    solReclaimed?: number;
    wallet?: string;
    errorMessage?: string;
    transactionId?: string;
    cluster?: string;
  }
) => {
  // Create Solscan URL if transaction ID exists
  const solscanUrl = data.transactionId ? 
    getSolscanUrl(data.transactionId, data.cluster) : 
    undefined;

  if (success) {
    return sendGAEvent('close_account_success', {
      event_category: 'account_management',
      event_label: 'Close Account',
      value: data.accountsClosed || 0,
      accounts_closed: data.accountsClosed || 0,
      sol_reclaimed: data.solReclaimed?.toFixed(9) || 0,
      wallet: data.wallet ? `${data.wallet.substring(0, 8)}...` : 'unknown',
      transaction_id: data.transactionId || 'unknown',
      solscan_url: solscanUrl || 'unknown',
      cluster: data.cluster || 'mainnet-beta',
      // Send current timestamp for time-based analytics
      timestamp: new Date().toISOString()
    });
  } else {
    return sendGAEvent('close_account_error', {
      event_category: 'account_management',
      event_label: 'Close Account Error',
      error_message: data.errorMessage || 'Unknown error',
      wallet: data.wallet ? `${data.wallet.substring(0, 8)}...` : 'unknown',
      cluster: data.cluster || 'mainnet-beta',
      // Send current timestamp for time-based analytics
      timestamp: new Date().toISOString()
    });
  }
}; 