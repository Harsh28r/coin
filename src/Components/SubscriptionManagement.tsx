import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

interface SubscriptionData {
  email: string;
  name: string;
  subscribedAt: string;
  isActive: boolean;
  preferences: {
    cryptoNews: boolean;
    marketUpdates: boolean;
    weeklyDigest: boolean;
  };
}

interface SubscriptionManagementProps {
  userEmail?: string;
  onClose?: () => void;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  userEmail,
  onClose
}) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    if (userEmail) {
      checkSubscriptionStatus(userEmail);
    }
  }, [userEmail]);

  const checkSubscriptionStatus = async (email: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subscribers?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success && data.subscriber) {
        setSubscription(data.subscriber);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setMessage('Failed to check subscription status');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;

    setUpdating(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: subscription.email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Successfully unsubscribed from our newsletter');
        setMessageType('success');
        setSubscription(null);
      } else {
        setMessage(data.message || 'Failed to unsubscribe');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setUpdating(false);
    }
  };

  const handleResubscribe = async () => {
    if (!subscription) return;

    setUpdating(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: subscription.email,
          name: subscription.name 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Successfully resubscribed to our newsletter');
        setMessageType('success');
        setSubscription({ ...subscription, isActive: true });
      } else {
        setMessage(data.message || 'Failed to resubscribe');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Resubscribe error:', error);
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ color: '#6b7280', margin: 0 }}>Checking subscription status...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      maxWidth: '500px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '8px',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      )}

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#1f2937',
          margin: '0 0 8px 0'
        }}>
          📧 Newsletter Subscription
        </h3>
        <p style={{
          color: '#6b7280',
          margin: '0',
          fontSize: '16px'
        }}>
          Manage your newsletter preferences
        </p>
      </div>

      {subscription ? (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #0ea5e9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: subscription.isActive ? '#10b981' : '#ef4444',
                marginRight: '8px'
              }}></div>
              <span style={{
                fontWeight: '600',
                color: subscription.isActive ? '#059669' : '#dc2626'
              }}>
                {subscription.isActive ? 'Active Subscription' : 'Inactive Subscription'}
              </span>
            </div>
            
            <div style={{ color: '#374151', fontSize: '14px' }}>
              <p style={{ margin: '4px 0' }}><strong>Email:</strong> {subscription.email}</p>
              {subscription.name && (
                <p style={{ margin: '4px 0' }}><strong>Name:</strong> {subscription.name}</p>
              )}
              <p style={{ margin: '4px 0' }}>
                <strong>Subscribed:</strong> {new Date(subscription.subscribedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 16px 0'
            }}>
              Email Preferences
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#374151' }}>Crypto News</span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: subscription.preferences.cryptoNews ? '#dcfce7' : '#fee2e2',
                  color: subscription.preferences.cryptoNews ? '#166534' : '#991b1b'
                }}>
                  {subscription.preferences.cryptoNews ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#374151' }}>Market Updates</span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: subscription.preferences.marketUpdates ? '#dcfce7' : '#fee2e2',
                  color: subscription.preferences.marketUpdates ? '#166534' : '#991b1b'
                }}>
                  {subscription.preferences.marketUpdates ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#374151' }}>Weekly Digest</span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: subscription.preferences.weeklyDigest ? '#dcfce7' : '#fee2e2',
                  color: subscription.preferences.weeklyDigest ? '#166534' : '#991b1b'
                }}>
                  {subscription.preferences.weeklyDigest ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {subscription.isActive ? (
              <button
                onClick={handleUnsubscribe}
                disabled={updating}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {updating ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            ) : (
              <button
                onClick={handleResubscribe}
                disabled={updating}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {updating ? 'Resubscribing...' : 'Resubscribe'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            📧
          </div>
          <h4 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Not Subscribed
          </h4>
          <p style={{
            color: '#6b7280',
            margin: '0 0 24px 0',
            lineHeight: '1.5'
          }}>
            You're not currently subscribed to our newsletter. Subscribe to get the latest crypto news and market updates!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#f97316',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Subscribe Now
          </button>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: messageType === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${messageType === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: messageType === 'success' ? '#166534' : '#991b1b',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionManagement;
