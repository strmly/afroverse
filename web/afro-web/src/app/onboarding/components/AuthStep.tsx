'use client';

import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';

/**
 * AuthStep Component
 * 
 * WhatsApp OTP authentication flow.
 * Handles phone input and OTP verification.
 */

interface AuthStepProps {
  onComplete: () => void;
}

export default function AuthStep({ onComplete }: AuthStepProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { sendOTP, verifyOTP, phoneE164 } = useAuthStore();
  
  // Handle phone submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Normalize phone number (add + if missing)
      let normalizedPhone = phoneInput.trim();
      if (!normalizedPhone.startsWith('+')) {
        // Assume South Africa if no country code
        normalizedPhone = '+27' + normalizedPhone.replace(/^0/, '');
      }
      
      await sendOTP(normalizedPhone);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle OTP input change
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    
    const newOTP = [...otpCode];
    newOTP[index] = value;
    setOtpCode(newOTP);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    
    // Auto-submit when complete
    if (index === 5 && value) {
      const code = [...newOTP.slice(0, 5), value].join('');
      handleOTPSubmit(code);
    }
  };
  
  // Handle OTP backspace
  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };
  
  // Handle OTP submit
  const handleOTPSubmit = async (code?: string) => {
    const finalCode = code || otpCode.join('');
    
    if (finalCode.length !== 6) {
      setError('Please enter complete code');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await verifyOTP(finalCode);
      
      // If verification successful, proceed
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
      setOtpCode(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resend OTP
  const handleResend = async () => {
    if (!phoneE164) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      await sendOTP(phoneE164);
      setOtpCode(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (step === 'phone') {
    return (
      <div className="auth-step">
        <div className="auth-header">
          <h1>Welcome to AfroMoji</h1>
          <p>Enter your phone number to get started</p>
        </div>
        
        <form onSubmit={handlePhoneSubmit} className="auth-form">
          <div className="phone-input-group">
            <div className="country-code">
              <span>🇿🇦</span>
              <span>+27</span>
            </div>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="82 123 4567"
              className="phone-input"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="continue-btn"
            disabled={isLoading || phoneInput.length < 9}
          >
            {isLoading ? 'Sending...' : 'Continue'}
          </button>
          
          <p className="privacy-note">
            We'll send you a verification code via WhatsApp.
            Standard rates may apply.
          </p>
        </form>
        
        <style jsx>{`
          .auth-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem;
            max-width: 400px;
            margin: 0 auto;
          }
          
          .auth-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .auth-header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
          }
          
          .auth-header p {
            font-size: 1rem;
            color: var(--text-secondary);
          }
          
          .auth-form {
            width: 100%;
          }
          
          .phone-input-group {
            display: flex;
            align-items: center;
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 12px;
            padding: 0.75rem;
            margin-bottom: 1rem;
          }
          
          .country-code {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-right: 0.75rem;
            border-right: 1px solid var(--border);
            font-size: 1rem;
            color: var(--text-primary);
          }
          
          .phone-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 1.125rem;
            color: var(--text-primary);
            padding-left: 0.75rem;
            outline: none;
          }
          
          .phone-input::placeholder {
            color: var(--text-tertiary);
          }
          
          .continue-btn {
            width: 100%;
            padding: 1rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.125rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          
          .continue-btn:hover:not(:disabled) {
            opacity: 0.9;
          }
          
          .continue-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .privacy-note {
            text-align: center;
            font-size: 0.875rem;
            color: var(--text-tertiary);
            margin-top: 1rem;
          }
          
          .error-message {
            padding: 0.75rem;
            background: #fee;
            color: #c33;
            border-radius: 8px;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="auth-step">
      <div className="auth-header">
        <h1>Enter Code</h1>
        <p>
          We sent a code to<br />
          <strong>{phoneE164}</strong>
        </p>
      </div>
      
      <div className="otp-form">
        <div className="otp-inputs">
          {otpCode.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleOTPKeyDown(index, e)}
              className="otp-digit"
              disabled={isLoading}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button
          type="button"
          onClick={handleResend}
          className="resend-btn"
          disabled={isLoading}
        >
          Resend Code
        </button>
        
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="change-number-btn"
        >
          Change Number
        </button>
      </div>
      
      <style jsx>{`
        .auth-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .auth-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        
        .auth-header p {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        
        .auth-header strong {
          color: var(--text-primary);
        }
        
        .otp-form {
          width: 100%;
        }
        
        .otp-inputs {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .otp-digit {
          width: 3rem;
          height: 3.5rem;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 600;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }
        
        .otp-digit:focus {
          border-color: var(--primary);
        }
        
        .resend-btn,
        .change-number-btn {
          width: 100%;
          padding: 1rem;
          background: transparent;
          color: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 0.75rem;
          transition: all 0.2s;
        }
        
        .resend-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }
        
        .change-number-btn {
          border-color: var(--border);
          color: var(--text-secondary);
        }
        
        .change-number-btn:hover {
          border-color: var(--text-secondary);
        }
        
        .resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-message {
          padding: 0.75rem;
          background: #fee;
          color: #c33;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}







