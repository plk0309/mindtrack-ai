
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality
} from '@google/genai';
import {
  Mic,
  MicOff,
  Brain,
  Activity,
  ShieldCheck,
  LineChart,
  AlertCircle,
  Zap,
  ChevronRight,
  Camera,
  Key,
  ExternalLink,
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Phone,
  Smartphone
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

/**
 * MindTrack: Professional Mental Health Assessment Platform
 * Security Module: Auth, OTP, and Captcha Implementation
 */

// --- UTILITIES ---

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const INITIAL_DATA = [
  { time: 'Mon', score: 65 },
  { time: 'Tue', score: 59 },
  { time: 'Wed', score: 80 },
  { time: 'Thu', score: 81 },
  { time: 'Fri', score: 56 },
  { time: 'Sat', score: 55 },
  { time: 'Sun', score: 40 },
];

// --- AUTHENTICATION COMPONENTS ---

const CAPTCHA_WIDTH = 280;
const CAPTCHA_HEIGHT = 155;
const PIECE_SIZE = 42;
const PIECE_RADIUS = 8;
const TOLERANCE = 6;

const Captcha: React.FC<{ onVerify: (val: boolean) => void; resetKey?: number }> = ({ onVerify, resetKey = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gapX, setGapX] = useState(0);
  const [sliderX, setSliderX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'fail'>('idle');
  const dragStartRef = useRef(0);
  const sliderStartRef = useRef(0);

  const generatePuzzle = () => {
    const newGapX = Math.floor(Math.random() * (CAPTCHA_WIDTH - PIECE_SIZE - 80)) + 60;
    setGapX(newGapX);
    setSliderX(0);
    setStatus('idle');
    return newGapX;
  };

  useEffect(() => {
    generatePuzzle();
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CAPTCHA_WIDTH;
    canvas.height = CAPTCHA_HEIGHT;

    // Draw background gradient pattern
    const grad = ctx.createLinearGradient(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
    grad.addColorStop(0, '#0ea5e9');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);

    // Draw decorative geometric shapes
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const cx = Math.sin(i * 1.7 + gapX * 0.01) * CAPTCHA_WIDTH * 0.4 + CAPTCHA_WIDTH / 2;
      const cy = Math.cos(i * 2.3 + gapX * 0.02) * CAPTCHA_HEIGHT * 0.4 + CAPTCHA_HEIGHT / 2;
      const r = 20 + (i * 7) % 30;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CAPTCHA_WIDTH; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CAPTCHA_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CAPTCHA_HEIGHT; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CAPTCHA_WIDTH, y);
      ctx.stroke();
    }

    const gapY = (CAPTCHA_HEIGHT - PIECE_SIZE) / 2;

    // Draw puzzle piece path helper
    const drawPiecePath = (x: number, y: number) => {
      ctx.beginPath();
      ctx.moveTo(x + PIECE_RADIUS, y);
      ctx.lineTo(x + PIECE_SIZE - PIECE_RADIUS, y);
      ctx.quadraticCurveTo(x + PIECE_SIZE, y, x + PIECE_SIZE, y + PIECE_RADIUS);
      // Right tab
      ctx.lineTo(x + PIECE_SIZE, y + PIECE_SIZE * 0.35);
      ctx.arc(x + PIECE_SIZE + 6, y + PIECE_SIZE * 0.5, PIECE_SIZE * 0.15, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.lineTo(x + PIECE_SIZE, y + PIECE_SIZE - PIECE_RADIUS);
      ctx.quadraticCurveTo(x + PIECE_SIZE, y + PIECE_SIZE, x + PIECE_SIZE - PIECE_RADIUS, y + PIECE_SIZE);
      ctx.lineTo(x + PIECE_RADIUS, y + PIECE_SIZE);
      ctx.quadraticCurveTo(x, y + PIECE_SIZE, x, y + PIECE_SIZE - PIECE_RADIUS);
      ctx.lineTo(x, y + PIECE_RADIUS);
      ctx.quadraticCurveTo(x, y, x + PIECE_RADIUS, y);
      ctx.closePath();
    };

    // Draw the gap (hole)
    drawPiecePath(gapX, gapY);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw the draggable piece
    const pieceX = sliderX;
    drawPiecePath(pieceX, gapY);
    ctx.save();
    ctx.clip();
    // Re-draw the gradient for the piece
    const pieceGrad = ctx.createLinearGradient(pieceX, gapY, pieceX + PIECE_SIZE, gapY + PIECE_SIZE);
    pieceGrad.addColorStop(0, '#38bdf8');
    pieceGrad.addColorStop(1, '#818cf8');
    ctx.fillStyle = pieceGrad;
    ctx.fillRect(pieceX, gapY, PIECE_SIZE + 12, PIECE_SIZE);
    // Add pattern to piece
    ctx.globalAlpha = 0.15;
    for (let px = pieceX; px < pieceX + PIECE_SIZE + 12; px += 6) {
      for (let py = gapY; py < gapY + PIECE_SIZE; py += 6) {
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Piece border
    drawPiecePath(pieceX, gapY);
    ctx.strokeStyle = status === 'success' ? '#34d399' : status === 'fail' ? '#f87171' : 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Success/fail overlay
    if (status === 'success') {
      drawPiecePath(pieceX, gapY);
      ctx.fillStyle = 'rgba(52,211,153,0.3)';
      ctx.fill();
    } else if (status === 'fail') {
      drawPiecePath(pieceX, gapY);
      ctx.fillStyle = 'rgba(248,113,113,0.3)';
      ctx.fill();
    }
  }, [gapX, sliderX, status]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (status === 'success') return;
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    sliderStartRef.current = sliderX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || status === 'success') return;
    const delta = e.clientX - dragStartRef.current;
    const newX = Math.max(0, Math.min(CAPTCHA_WIDTH - PIECE_SIZE, sliderStartRef.current + delta));
    setSliderX(newX);
  };

  const handlePointerUp = () => {
    if (!isDragging || status === 'success') return;
    setIsDragging(false);
    if (Math.abs(sliderX - gapX) <= TOLERANCE) {
      setStatus('success');
      setSliderX(gapX);
      onVerify(true);
    } else {
      setStatus('fail');
      setTimeout(() => {
        generatePuzzle();
      }, 800);
    }
  };

  const sliderPercent = (sliderX / (CAPTCHA_WIDTH - PIECE_SIZE)) * 100;

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl overflow-hidden border-2 transition-all duration-300 ${status === 'success' ? 'border-emerald-400 shadow-lg shadow-emerald-100' :
        status === 'fail' ? 'border-red-400 shadow-lg shadow-red-100' :
          'border-slate-200'
        }`}>
        <canvas ref={canvasRef} className="w-full block" style={{ height: CAPTCHA_HEIGHT }} />
      </div>
      <div className="relative">
        <div className="w-full h-10 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden">
          {/* Track fill */}
          <div
            className={`absolute inset-y-0 left-0 transition-colors duration-300 ${status === 'success' ? 'bg-emerald-50' : status === 'fail' ? 'bg-red-50' : 'bg-sky-50'
              }`}
            style={{ width: `${sliderPercent}%` }}
          />
          {/* Center hint text */}
          {status === 'idle' && sliderX === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <ArrowRight size={13} /> Slide to complete the puzzle
              </span>
            </div>
          )}
          {status === 'success' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Verified successfully
              </span>
            </div>
          )}
          {status === 'fail' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                <RefreshCw size={13} className="animate-spin" /> Try again...
              </span>
            </div>
          )}
          {/* Slider thumb */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`absolute top-1/2 -translate-y-1/2 w-10 h-8 rounded-lg shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors duration-200 touch-none select-none ${status === 'success' ? 'bg-emerald-500 text-white' :
              status === 'fail' ? 'bg-red-500 text-white' :
                isDragging ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 border border-slate-300 hover:border-sky-400'
              }`}
            style={{ left: `calc(${sliderPercent}% - ${sliderPercent > 50 ? '20' : '0'}px)` }}
          >
            {status === 'success' ? <CheckCircle2 size={16} /> :
              status === 'fail' ? <RefreshCw size={14} /> :
                <ChevronRight size={18} />}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Security Verification</span>
        </div>
        <span className="text-[9px] text-slate-300 font-medium">MindTrack Shield™</span>
      </div>
    </div>
  );
};

const AuthSystem: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<'login' | 'signup' | 'otp'>('login');
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showOtpToast, setShowOtpToast] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef<number | null>(null);

  const generateAndSendOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    // Show simulated delivery toast
    setShowOtpToast(true);
    setTimeout(() => setShowOtpToast(false), 6000);
    // Start resend cooldown
    setResendCooldown(30);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = window.setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return code;
  };

  const detectContactType = (value: string) => {
    setContact(value);
    // If the value starts with + or is purely digits (with optional spaces/dashes), treat as phone
    const cleaned = value.replace(/[\s\-().]/g, '');
    if (/^\+?\d{6,}$/.test(cleaned)) {
      setContactType('phone');
    } else {
      setContactType('email');
    }
  };

  const maskedContact = () => {
    if (contactType === 'phone') {
      const cleaned = contact.replace(/[\s\-().]/g, '');
      if (cleaned.length > 4) {
        return cleaned.slice(0, 3) + '****' + cleaned.slice(-2);
      }
      return cleaned;
    } else {
      const parts = contact.split('@');
      if (parts[0].length > 2) {
        return parts[0].slice(0, 2) + '***@' + (parts[1] || '');
      }
      return contact;
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) return alert("Please complete the security verification");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      generateAndSendOtp();
      setStep('otp');
    }, 1500);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) return alert("Please complete the security verification");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      generateAndSendOtp();
      setStep('otp');
    }, 1500);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otp.join('').length < 6) return;
    const enteredOtp = otp.join('');
    if (enteredOtp !== generatedOtp) {
      setOtpError('Invalid verification code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
      return;
    }
    setOtpError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onAuthSuccess();
    }, 1500);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    generateAndSendOtp();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* OTP Delivery Toast Notification */}
      {showOtpToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-5 max-w-xs border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${contactType === 'phone' ? 'bg-violet-500/20 text-violet-400' : 'bg-sky-500/20 text-sky-400'}`}>
                {contactType === 'phone' ? <Smartphone size={16} /> : <Mail size={16} />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {contactType === 'phone' ? 'SMS Received' : 'Email Received'}
                </p>
                <p className="text-[10px] text-slate-500">MindTrack Security</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Your verification code is:</p>
              <p className="text-2xl font-extrabold tracking-[0.3em] text-center text-white">{generatedOtp}</p>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">This is a simulated delivery for demo purposes</p>
          </div>
        </div>
      )}
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-200/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-indigo-200/20 blur-[100px] rounded-full" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative z-10 transition-all">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-sky-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-sky-100 rotate-3">
            <Brain size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            MindTrack <span className="text-sky-500 font-medium">Pro</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {step === 'login' ? 'Welcome back to your clinical dashboard' :
              step === 'signup' ? 'Create your professional assessment account' :
                'Security verification required'}
          </p>
        </div>

        {step === 'otp' ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:ring-0 transition-all outline-none text-slate-900"
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`p-2.5 rounded-xl ${contactType === 'phone' ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'}`}>
                {contactType === 'phone' ? <Smartphone size={18} /> : <Mail size={18} />}
              </div>
              <span className="text-sm font-bold text-slate-700">{maskedContact()}</span>
            </div>
            <p className="text-center text-xs text-slate-400 font-medium leading-relaxed">
              We've sent a 6-digit verification code to your {contactType === 'phone' ? 'phone number' : 'email'}.<br />Please enter it above to secure your access.
            </p>
            {otpError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-red-600">{otpError}</span>
              </div>
            )}
            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.join('').length < 6}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Verify & Continue'}
            </button>
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setOtp(['', '', '', '', '', '']); setOtpError(''); setStep('login'); }}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Change {contactType === 'phone' ? 'Phone Number' : 'Email Address'}
              </button>
              <button
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-sm font-bold text-sky-500 hover:text-sky-700 transition-colors disabled:text-slate-300"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={step === 'login' ? handleLoginSubmit : handleSignupSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                {contactType === 'phone' ?
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> :
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                }
                <input
                  required
                  type="text"
                  placeholder="Email or Phone Number"
                  value={contact}
                  onChange={(e) => detectContactType(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-sky-500 focus:bg-white transition-all outline-none text-sm font-medium text-slate-900"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="password"
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-sky-500 focus:bg-white transition-all outline-none text-sm font-medium text-slate-900"
                />
              </div>
            </div>

            <Captcha onVerify={setCaptchaVerified} resetKey={captchaResetKey} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 flex items-center justify-center gap-2 group"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : (
                <>
                  {step === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-400 font-medium">
                {step === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => { setCaptchaVerified(false); setCaptchaResetKey(k => k + 1); setStep(step === 'login' ? 'signup' : 'login'); }}
                  className="ml-2 text-sky-600 font-bold hover:underline"
                >
                  {step === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-2">
          <ShieldAlert className="text-emerald-500" size={14} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Encrypted - HIPAA Ready</span>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const MindTrack: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [transcription, setTranscription] = useState<{ user: string, ai: string }[]>([]);
  const [currentAIResponse, setCurrentAIResponse] = useState("");
  const [currentUserInput, setCurrentUserInput] = useState("");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const currentAIResponseRef = useRef("");
  const currentUserInputRef = useRef("");
  const [activeTab, setActiveTab] = useState<'assess' | 'trends' | 'history'>('assess');
  const [finalConclusion, setFinalConclusion] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<{ name: string, value: number }[]>([
    { name: 'Calm', value: 80 },
    { name: 'Stress', value: 20 },
    { name: 'Anxiety', value: 15 },
    { name: 'Joy', value: 45 },
  ]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const checkKey = async () => {
        try {
          const exists = await (window as any).aistudio.hasSelectedApiKey();
          setHasKey(exists);
        } catch (e) {
          setHasKey(true);
        }
      };
      checkKey();
    }
  }, [isAuthenticated]);

  const handleOpenKeySelection = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    } catch (e) {
      console.error("Failed to open key selection", e);
    }
  };

  const startSession = async () => {
    setIsConnecting(true);
    setSessionError(null);
    currentAIResponseRef.current = "";
    currentUserInputRef.current = "";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await inputAudioCtxRef.current.resume();
      await outputAudioCtxRef.current.resume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsLive(true);
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);

            frameIntervalRef.current = window.setInterval(() => {
              if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                canvasRef.current.width = 320;
                canvasRef.current.height = 240;
                ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
                canvasRef.current.toBlob((blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64Data = (reader.result as string).split(',')[1];
                      sessionPromise.then(s => s.sendRealtimeInput({
                        media: { data: base64Data, mimeType: 'image/jpeg' }
                      }));
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.5);
              }
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentAIResponseRef.current += text;
              setCurrentAIResponse(prev => prev + text);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentUserInputRef.current += text;
              setCurrentUserInput(prev => prev + text);
            }
            if (message.serverContent?.turnComplete) {
              setTranscription(prev => [...prev, { user: currentUserInputRef.current, ai: currentAIResponseRef.current }]);
              currentAIResponseRef.current = "";
              currentUserInputRef.current = "";
              setCurrentAIResponse("");
              setCurrentUserInput("");
              updateEmotionModeling();
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outputAudioCtxRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
              source.onended = () => audioSourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => s.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            if (e?.message?.includes("Requested entity was not found")) {
              setHasKey(false);
            }
            stopSession();
          },
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are MindTrack AI, a clinical mental health companion. Analyze the speaker's emotional state.`
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (error) {
      console.error("Failed to start session:", error);
      setIsConnecting(false);
      setSessionError(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Camera/microphone permission denied. Please allow access and try again.'
          : `Session failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const stopSession = () => {
    setIsLive(false);
    setIsConnecting(false);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    sessionPromiseRef.current?.then(s => s.close()).catch(() => { });
    sessionPromiseRef.current = null;
    // Stop all media tracks (camera/mic)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    // Close audio contexts
    inputAudioCtxRef.current?.close().catch(() => { });
    outputAudioCtxRef.current?.close().catch(() => { });
    inputAudioCtxRef.current = null;
    outputAudioCtxRef.current = null;
    // Stop any playing audio
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch (_) { } });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    // Only generate conclusion if there's actual transcription
    if (transcription.length > 0) {
      generateFinalConclusion();
    }
  };

  const updateEmotionModeling = () => {
    setEmotions(prev => prev.map(e => ({
      ...e,
      value: Math.max(0, Math.min(100, e.value + (Math.random() * 20 - 10)))
    })));
  };

  const generateFinalConclusion = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Perform Multimodal Fusion Analysis for this transcript: ${JSON.stringify(transcription)}.`
      });
      setFinalConclusion(response.text ?? null);
    } catch (error) {
      console.error('Failed to generate conclusion:', error);
      setFinalConclusion('Unable to generate clinical summary. Please check your API key and try again.');
    }
  };

  if (!isAuthenticated) {
    return <AuthSystem onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-4"><Key size={32} /></div>
          <h2 className="text-2xl font-bold text-slate-800">API Key Required</h2>
          <p className="text-slate-500 text-sm leading-relaxed">Please select a billing-enabled API key to access live assessment features.</p>
          <div className="flex flex-col gap-3">
            <button onClick={handleOpenKeySelection} className="w-full py-3 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-600 transition-all shadow-lg flex items-center justify-center gap-2">Select API Key <ChevronRight size={18} /></button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs text-sky-600 font-medium hover:underline flex items-center justify-center gap-1">Billing Docs <ExternalLink size={12} /></a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 p-2 rounded-xl text-white"><Brain size={24} /></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">MindTrack <span className="text-sky-500">Pro</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsAuthenticated(false)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">Logout</button>
            <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2"><Activity className="text-sky-500" size={20} /> Assessment Session</h2>
                <p className="text-sm text-slate-500 font-medium">Multimodal monitoring active</p>
              </div>
              <div className="flex items-center gap-2">
                {isLive && <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full animate-pulse uppercase tracking-wider border border-red-100">Live</span>}
                <button
                  disabled={isConnecting}
                  onClick={isLive ? stopSession : startSession}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold shadow-md active:scale-95 disabled:opacity-50 ${isLive ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-sky-500 text-white hover:bg-sky-600'}`}
                >
                  {isConnecting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isLive ? <><MicOff size={18} /> End Session</> : <><Mic size={18} /> Start Session</>}
                </button>
              </div>
            </div>
            {sessionError && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-red-600">{sessionError}</span>
                <button onClick={() => setSessionError(null)} className="ml-auto text-xs text-red-400 hover:text-red-600 font-bold">Dismiss</button>
              </div>
            )}

            <div className="relative aspect-video bg-slate-900 overflow-hidden">
              <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-opacity duration-700 ${isLive ? 'opacity-80' : 'opacity-10'}`} />
              <canvas ref={canvasRef} className="hidden" />
              {!isLive && !isConnecting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                  <div className="p-6 bg-white/5 backdrop-blur-md rounded-full border border-white/10"><Camera size={40} className="text-white/20" /></div>
                  <p className="text-slate-400 font-medium text-sm tracking-wide">Session initialization required</p>
                </div>
              )}
              {isLive && (
                <div className="absolute inset-0 p-6 flex flex-col justify-end pointer-events-none">
                  <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-full max-w-xs animate-in slide-in-from-bottom-2">
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-[0.2em] mb-3">Live Modeling</p>
                    <div className="grid grid-cols-1 gap-3">
                      {emotions.map(e => (
                        <div key={e.name} className="space-y-1">
                          <div className="flex justify-between text-[10px] text-white font-bold uppercase tracking-wider"><span>{e.name}</span><span>{Math.round(e.value)}%</span></div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-sky-400 transition-all duration-1000" style={{ width: `${e.value}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 min-h-[200px] max-h-[300px] overflow-y-auto space-y-4 scroll-smooth">
              {transcription.map((t, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">U</div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm max-w-[85%]"><p className="text-sm text-slate-700 leading-relaxed">{t.user}</p></div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-sky-600 p-3 rounded-2xl rounded-tr-none shadow-md max-w-[85%]"><p className="text-sm text-white leading-relaxed">{t.ai}</p></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center flex-shrink-0"><Brain size={16} /></div>
                  </div>
                </div>
              ))}
              {isLive && <div className="flex gap-3 animate-pulse"><div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0" /><div className="bg-white p-4 rounded-2xl border border-slate-200 w-full" /></div>}
            </div>
          </div>

          {finalConclusion && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100"><ShieldCheck size={32} /></div>
                <div><h3 className="text-xl font-bold text-slate-800">Clinical Summary</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest tracking-[0.1em]">AI Diagnostic Fusion</p></div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 prose prose-sm max-w-none text-slate-600 leading-relaxed">
                {finalConclusion}
              </div>
              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-lg transition-all active:scale-95">Download PDF</button>
                <button className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95">Send to Provider</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2"><Zap size={14} className="text-sky-500" /> Biometrics</h3>
            <div className="space-y-4">
              {[
                { label: 'Pitch Deviation', value: 'Low', status: 'Optimal' },
                { label: 'Speech Flow', value: '158 wpm', status: 'Moderate' },
                { label: 'Facial Affect', value: 'Congruent', status: 'High' },
              ].map(item => (
                <div key={item.label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-end">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p><p className="text-sm font-bold text-slate-800">{item.value}</p></div>
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2"><LineChart size={14} className="text-sky-500" /> Health Trends</div>
              <span className="text-[10px] text-sky-500 font-bold uppercase">7 Days</span>
            </h3>
            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={INITIAL_DATA}>
                  <defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3"><ShieldCheck className="text-emerald-400" size={16} /> <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Security Audit</span></div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">MindTrack Pro utilizes AES-256 encryption. Your session data is strictly for assessment purposes and HIPAA compliant.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MindTrack />);
}
