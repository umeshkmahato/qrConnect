'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    setBusy(true); setError('');
    try {
      const r = await api.requestOtp(phone);
      setOtpSent(true);
      setDevOtp(r.devOtp); // only present when OTP_DEV_ECHO is on (development)
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setError('');
    try {
      const r = await api.verifyOtp(phone, code);
      setToken(r.accessToken);
      router.replace('/dashboard');
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '60px auto' }}>
      <h2>Sign in</h2>
      <p className="muted">Phone OTP sign-in for administrators and organization staff.</p>
      <label>Phone number</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />
      {otpSent && (
        <>
          <label>OTP</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" maxLength={6} />
          {devOtp && <p className="muted">Development OTP: {devOtp}</p>}
        </>
      )}
      {error && <p className="error">{error}</p>}
      <div className="row">
        {!otpSent
          ? <button className="btn" onClick={sendOtp} disabled={busy || !phone}>Send OTP</button>
          : <button className="btn" onClick={verify} disabled={busy || code.length !== 6}>Verify</button>}
      </div>
    </div>
  );
}
