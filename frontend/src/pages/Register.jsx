import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Button } from '../components/common/Button';

function FormField({ label, id, type = 'text', value, onChange, placeholder, error, rightElement }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[#AAA89F] mb-2 tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${error ? 'border-[#A96A5F] focus:border-[#A96A5F]' : ''}`}
          autoComplete={type === 'password' ? 'new-password' : 'off'}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-[#A96A5F] flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      // Always go to onboarding after registration
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your RouteMaster account"
      subtitle="Start building a learning route designed around your goals."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-4 bg-[#A96A5F]/10 border border-[#A96A5F]/30 rounded-lg"
          >
            <AlertCircle size={14} className="text-[#A96A5F] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#A96A5F]">{serverError}</p>
          </motion.div>
        )}

        <FormField
          label="Full Name"
          id="name"
          value={form.name}
          onChange={update('name')}
          placeholder="Abhishek Kumar"
          error={errors.name}
        />
        <FormField
          label="Email"
          id="email"
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
          error={errors.email}
        />
        <FormField
          label="Password"
          id="password"
          type={showPw ? 'text' : 'password'}
          value={form.password}
          onChange={update('password')}
          placeholder="Min. 8 characters"
          error={errors.password}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="text-[#77766F] hover:text-[#AAA89F] transition-colors cursor-pointer"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />
        <FormField
          label="Confirm Password"
          id="confirmPassword"
          type={showCpw ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          placeholder="Repeat password"
          error={errors.confirmPassword}
          rightElement={
            <button
              type="button"
              onClick={() => setShowCpw((v) => !v)}
              className="text-[#77766F] hover:text-[#AAA89F] transition-colors cursor-pointer"
            >
              {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon={!loading && <ArrowRight size={15} />}
          size="lg"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-[#77766F]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#C89B5B] hover:text-[#D4AA6C] transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
