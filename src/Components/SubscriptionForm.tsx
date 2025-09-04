import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

interface SubscriptionFormProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
  showName?: boolean;
  title?: string;
  description?: string;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  onSuccess,
  onError,
  className = '',
  showName = false,
  title = 'Stay Updated with Crypto News',
  description = 'Get the latest cryptocurrency news, market updates, and insights delivered to your inbox.'
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      onError?.('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      onError?.('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Successfully subscribed! Check your email for confirmation.');
        setMessageType('success');
        setEmail('');
        setName('');
        onSuccess?.();
      } else {
        setMessage(data.message || 'Failed to subscribe. Please try again.');
        setMessageType('error');
        onError?.(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setMessage('Network error. Please check your connection and try again.');
      setMessageType('error');
      onError?.('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`subscription-form ${className}`} style={{
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      borderRadius: '20px',
      padding: '32px',
      color: 'white',
      boxShadow: '0 20px 40px rgba(249, 115, 22, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        zIndex: 0
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            margin: '0 0 8px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {title}
          </h3>
          <p style={{ 
            fontSize: '16px', 
            margin: '0', 
            opacity: '0.9',
            lineHeight: '1.5'
          }}>
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {showName && (
            <div>
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: '#333',
                  boxSizing: 'border-box'
                }}
                disabled={loading}
              />
            </div>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '16px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: '#333',
                boxSizing: 'border-box'
              }}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              backgroundColor: 'white',
              color: '#f97316',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #f97316',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Subscribing...
              </div>
            ) : (
              'Subscribe Now'
            )}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: messageType === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${messageType === 'success' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
            color: messageType === 'success' ? '#10b981' : '#ef4444',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          opacity: '0.8',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          By subscribing, you agree to receive our newsletter. You can unsubscribe at any time.
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionForm;
