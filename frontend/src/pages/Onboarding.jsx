import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, X, Check, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import client from '../services/api';

const STEPS = ['About You', 'Skills & Background', 'Your Goal'];

const SKILL_SUGGESTIONS = ['Python', 'JavaScript', 'SQL', 'React', 'Machine Learning', 'Data Analysis', 'Statistics', 'Docker', 'NumPy', 'Pandas'];
const INTEREST_OPTIONS = ['AI', 'ML', 'GenAI', 'Web Development', 'Data Science', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'LLMs', 'NLP'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const WEEKLY_HOURS = ['2 hrs / week', '5 hrs / week', '7 hrs / week', '10 hrs / week', '15+ hrs / week'];

function TagInput({ tags, setTags, placeholder, suggestions }) {
  const [input, setInput] = useState('');
  const addTag = (val) => {
    const v = val.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setInput('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C89B5B]/10 border border-[#C89B5B]/30 text-[#C89B5B] text-xs rounded-full">
            {t}
            <button onClick={() => setTags(tags.filter((x) => x !== t))} className="cursor-pointer hover:opacity-70 transition-opacity"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          className="px-3 py-2 bg-[#22221E] border border-[#383832] rounded-lg text-[#AAA89F] hover:text-[#F3F0E8] cursor-pointer transition-colors"
        ><Plus size={14} /></button>
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.filter((s) => !tags.includes(s)).map((s) => (
            <button
              key={s} onClick={() => addTag(s)}
              className="px-2 py-0.5 text-[10px] bg-[#22221E] border border-[#383832] text-[#77766F] hover:text-[#F3F0E8] hover:border-[#C89B5B]/40 rounded cursor-pointer transition-colors"
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectOption({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt} type="button" onClick={() => onChange(opt)}
          className={`px-4 py-2 text-sm rounded-lg border transition-all cursor-pointer ${
            value === opt
              ? 'bg-[#C89B5B]/10 border-[#C89B5B]/60 text-[#C89B5B]'
              : 'bg-transparent border-[#383832] text-[#AAA89F] hover:border-[#C89B5B]/30 hover:text-[#F3F0E8]'
          }`}
        >
          {value === opt && <Check size={12} className="inline mr-1.5" />}
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    education: '',
    branch: '',
    experience: 'Intermediate',
    skills: [],
    interests: [],
    projects: '',
    certifications: '',
    target_career: '',
    weekly_learning_hours: 7,
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Save profile to FastAPI
      await client.put('/users/me', {
        ...form,
        onboarding_completed: true,
      });

      // Update local auth state
      updateUser({ onboarding_completed: true, target_career: form.target_career });

      // Get career recommendation
      navigate('/recommendation');
    } catch (err) {
      setError(err.message || 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return true; // skills optional
    if (step === 2) return form.target_career.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#171714] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#C89B5B] mb-4">RouteMaster</div>
          <div className="label mb-3">Step {step + 1} of {STEPS.length}</div>
          <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
            Tell us where you're starting.
          </h1>
          <p className="text-sm text-[#AAA89F]">Your answers help RouteMaster construct your initial learning route.</p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="h-1 rounded-full transition-all duration-300" style={{ width: i === step ? 40 : 20, backgroundColor: i <= step ? '#C89B5B' : '#383832' }} />
              <span className="text-xs hidden sm:inline" style={{ color: i === step ? '#C89B5B' : '#77766F' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-[#22221E] border border-[#383832] rounded-xl p-8 space-y-6"
          >
            {step === 0 && (
              <>
                <div>
                  <label className="label block mb-2">Full Name</label>
                  <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="label block mb-2">Education</label>
                  <input value={form.education} onChange={(e) => update('education', e.target.value)} placeholder="e.g. B.Tech Computer Science" />
                </div>
                <div>
                  <label className="label block mb-2">Branch / Specialization</label>
                  <input value={form.branch} onChange={(e) => update('branch', e.target.value)} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label className="label block mb-2">Experience Level</label>
                  <SelectOption options={EXPERIENCE_LEVELS} value={form.experience} onChange={(v) => update('experience', v)} />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="label block mb-2">Your Current Skills</label>
                  <TagInput tags={form.skills} setTags={(v) => update('skills', v)} placeholder="Add a skill..." suggestions={SKILL_SUGGESTIONS} />
                </div>
                <div>
                  <label className="label block mb-2">Interests</label>
                  <TagInput tags={form.interests} setTags={(v) => update('interests', v)} placeholder="Add an interest..." suggestions={INTEREST_OPTIONS} />
                </div>
                <div>
                  <label className="label block mb-2">Notable Projects <span className="text-[#77766F] normal-case font-normal">(optional)</span></label>
                  <textarea value={form.projects} onChange={(e) => update('projects', e.target.value)} placeholder="Describe any projects you've built..." rows={3} className="resize-none" />
                </div>
                <div>
                  <label className="label block mb-2">Certifications <span className="text-[#77766F] normal-case font-normal">(optional)</span></label>
                  <input value={form.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="e.g. AWS Cloud Practitioner, Python for DS" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="label block mb-2">Target Career</label>
                  <input value={form.target_career} onChange={(e) => update('target_career', e.target.value)} placeholder="e.g. AI / ML Engineer" />
                  <p className="text-xs text-[#77766F] mt-1.5">Don't worry — RouteMaster will also recommend careers based on your profile.</p>
                </div>
                <div>
                  <label className="label block mb-2">Weekly Learning Time</label>
                  <SelectOption
                    options={WEEKLY_HOURS}
                    value={`${form.weekly_learning_hours} hrs / week`}
                    onChange={(v) => update('weekly_learning_hours', parseInt(v))}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && <p className="mt-3 text-sm text-[#A96A5F] text-center">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} icon={<ChevronLeft size={14} />}>Back</Button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} icon={<ChevronRight size={14} />}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading} disabled={!canProceed()} icon={!loading && <ArrowRight size={14} />}>
              {loading ? 'Building your route...' : 'Build My Route'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
