import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookContext } from '../constexts/bookContext';
import axios from 'axios';

const OtpVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setloginPanel, fetchToken } = useContext(BookContext);
  const identifier = location.state?.identifier;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!identifier) navigate('/login', { replace: true });
  }, [identifier, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier) return;
    if (otp.length !== 6) {
      setError('Enter a valid 6-digit OTP');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      const response = await axios.post('/otp/verifyOtp', { identifier, otp });
      if (!response.data.success) throw new Error(response.data.message || 'Invalid OTP, please try again');
      await fetchToken();
      setOtp('');
      setloginPanel(false);
      const destination = location.state?.from?.pathname ||
        (response.data.role === 'owner' ? '/owner/dashboard' : '/');
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!identifier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-8 shadow-xl">
        <h1 className="text-center text-2xl font-bold text-gray-800">Verify OTP</h1>
        <p className="mb-6 mt-2 text-center text-sm text-gray-500">
          Sent to <span className="font-medium text-gray-700">{identifier}</span>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="6-digit OTP"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
          {error && <p role="alert" className="text-center text-sm text-red-600">{error}</p>}
          <button disabled={verifying || otp.length !== 6} type="submit" className="rounded-xl bg-lime-500 py-3 font-semibold text-gray-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-50">
            {verifying ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>
        <button type="button" onClick={() => navigate('/login', { replace: true })} className="mt-4 w-full py-2 text-center text-sm text-blue-600 hover:underline">
          Wrong number or email? Go back
        </button>
      </div>
    </div>
  );
};

export default OtpVerify;
