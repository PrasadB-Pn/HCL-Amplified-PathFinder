import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { profileService } from '../services/profileService';

const STEPS = ['About You', 'Your Skills', 'Your Goals'];

const SKILL_SUGGESTIONS = ['Python', 'JavaScript', 'SQL', 'React', 'Machine Learning', 'Data Analysis', 'Statistics', 'Docker'];
const INTEREST_OPTIONS = ['AI', 'ML', 'GenAI', 'Web Development', 'Data Science', 'Cloud Computing', 'DevOps', 'Cybersecurity'];
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
            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="cursor-pointer">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          className="px-3 py-2 bg-[#22221E] border border-[#383832] rounded-lg text-[#AAA89F] hover:text-[#F3F0E8] cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.filter((s) => !tags.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="px-2 py-0.5 text-[10px] bg-[#22221E] border border-[#383832] text-[#77766F] hover:text-[#F3F0E8] hover:border-[#C89B5B]/40 rounded cursor-pointer transition-colors"
            >
              {s}
            </button>
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
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
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

export default function Profile() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    education: '',
    branch: '',
    experience: 'Intermediate',
    skills: [],
    interests: [],
    projects: '',
    certifications: '',
    targetCareer: '',
    weeklyHours: '7 hrs / week',
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const hours = parseInt(form.weeklyHours, 10) || 7;
      await profileService.updateProfile({
        name: form.name,
        education: form.education,
        branch: form.branch,
        experience: form.experience,
        skills: form.skills,
        interests: form.interests,
        projects: form.projects,
        certifications: form.certifications,
        target_career: form.targetCareer,
        weekly_learning_hours: hours,
        onboarding_completed: true,
      });
      navigate('/recommendation');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171714] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="label mb-3">Step {step + 1} of {STEPS.length}</div>
          <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">Tell us where you're starting.</h1>
          <p className="text-sm text-[#AAA89F]">Your answers help RouteMaster construct your initial route.</p>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-[#A96A5F]/10 border border-[#A96A5F]/40 rounded-xl text-xs text-[#A96A5F] flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 32 : 16,
                backgroundColor: i <= step ? '#C89B5B' : '#383832',
              }}
            />
          ))}
        </div>

        {/* Step labels */}
        <div className="flex justify-center gap-8 mb-8">
          {STEPS.map((s, i) => (
            <span key={s} className="text-xs" style={{ color: i === step ? '#C89B5B' : '#77766F' }}>{s}</span>
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
                  <input
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label block mb-2">Education</label>
                  <input
                    value={form.education}
                    onChange={(e) => update('education', e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label block mb-2">Branch / Specialization</label>
                  <input
                    value={form.branch}
                    onChange={(e) => update('branch', e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
                  />
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
                  <label className="label block mb-2">Your Skills</label>
                  <TagInput tags={form.skills} setTags={(v) => update('skills', v)} placeholder="Add a skill..." suggestions={SKILL_SUGGESTIONS} />
                </div>
                <div>
                  <label className="label block mb-2">Interests</label>
                  <TagInput tags={form.interests} setTags={(v) => update('interests', v)} placeholder="Add an interest..." suggestions={INTEREST_OPTIONS} />
                </div>
                <div>
                  <label className="label block mb-2">Notable Projects (optional)</label>
                  <textarea
                    value={form.projects}
                    onChange={(e) => update('projects', e.target.value)}
                    placeholder="Describe any projects you've built..."
                    rows={3}
                    className="w-full bg-[#171714] border border-[#383832] rounded-lg p-3 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="label block mb-2">Certifications (optional)</label>
                  <input
                    value={form.certifications}
                    onChange={(e) => update('certifications', e.target.value)}
                    placeholder="e.g. AWS Cloud Practitioner"
                    className="w-full bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="label block mb-2">Target Career</label>
                  <input
                    value={form.targetCareer}
                    onChange={(e) => update('targetCareer', e.target.value)}
                    placeholder="e.g. AI / ML Engineer"
                    className="w-full bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="label block mb-2">Weekly Learning Hours</label>
                  <SelectOption options={WEEKLY_HOURS} value={form.weeklyHours} onChange={(v) => update('weeklyHours', v)} />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} icon={<ChevronLeft size={14} />}>Back</Button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} icon={<ChevronRight size={14} />}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Build My Route
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
