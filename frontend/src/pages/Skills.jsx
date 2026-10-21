import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SkillIndicator } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { LoadingState, ErrorState } from '../components/common/States';
import { skillService } from '../services/skillService';

const SKILL_CATEGORIES = ['Programming', 'Data', 'Machine Learning', 'AI / Deep Learning', 'MLOps'];

const PRIORITY_COLOR = { HIGH: '#A96A5F', UPCOMING: '#C89B5B', FUTURE: '#77766F' };

export default function Skills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    (async () => {
      try {
        const [skillsData, gapsData] = await Promise.all([
          skillService.getSkills(),
          skillService.getSkillGaps(),
        ]);
        setSkills(skillsData || []);
        setSkillGaps(gapsData?.skill_gaps || []);
      } catch (e) {
        setError(e.message || 'Unable to load skills');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState message="Loading your skills..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const filtered = activeCategory === 'all'
    ? skills
    : skills.filter((s) => s.category === activeCategory);

  const grouped = SKILL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filtered.filter((s) => s.category === cat);
    return acc;
  }, {});

  const strong = skills.filter((s) => s.status === 'strong' || s.proficiency >= 75);
  const developing = skills.filter((s) => s.status === 'developing' || (s.proficiency >= 50 && s.proficiency < 75));
  const needsAttention = skills.filter((s) => s.status === 'needs_attention' || s.proficiency < 50);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {isDemo && (
        <div className="mb-6 px-4 py-2 bg-[#C89B5B]/10 border border-[#C89B5B]/30 rounded-lg text-xs text-[#C89B5B]">
          <strong>Demo Mode Active:</strong> Displaying simulated skills.
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="label mb-3">Skill Intelligence</div>
        <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">Your Skills</h1>
        <p className="text-[#AAA89F]">Understand your strengths, identify gaps, and see what your goal requires next.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile summary */}
          <div className="border border-[#383832] rounded-xl p-6">
            <div className="label mb-3">Your Current Profile</div>
            <p className="text-sm text-[#AAA89F] leading-relaxed mb-4">
              {strong.length > 0 ? (
                <>Your strongest skills are <span className="text-[#F3F0E8]">{strong.slice(0, 3).map((s) => s.name).join(', ')}</span>. </>
              ) : (
                <>You are beginning your skill assessment. </>
              )}
              Tracking proficiency across core competencies for your career roadmap.
            </p>
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#383832]">
              {[
                { label: 'Skills Tracked', value: skills.length, color: '#F3F0E8' },
                { label: 'Strong', value: strong.length, color: '#8C9A7A' },
                { label: 'Developing', value: developing.length, color: '#C89B5B' },
                { label: 'Need Attention', value: needsAttention.length, color: '#A96A5F' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-2xl font-semibold" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[10px] text-[#77766F] mt-1 uppercase tracking-wide">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Landscape */}
          <div>
            <div className="label mb-4">Skill Landscape</div>
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#C89B5B] text-[#171714]'
                    : 'bg-[#22221E] border border-[#383832] text-[#77766F] hover:text-[#F3F0E8]'
                }`}
              >
                All Categories ({skills.length})
              </button>
              {SKILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#C89B5B] text-[#171714]'
                      : 'bg-[#22221E] border border-[#383832] text-[#77766F] hover:text-[#F3F0E8]'
                  }`}
                >
                  {cat} ({grouped[cat]?.length || 0})
                </button>
              ))}
            </div>

            {/* Skill list */}
            <div className="space-y-3">
              {filtered.map((skill) => (
                <div key={skill.id || skill.name} className="border border-[#383832] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-[#F3F0E8]">{skill.name}</span>
                      <span className="text-xs text-[#AAA89F] font-semibold">{skill.proficiency}%</span>
                    </div>
                    <SkillIndicator
                      name=""
                      value={skill.proficiency}
                      color={skill.proficiency >= 75 ? '#8C9A7A' : skill.proficiency >= 50 ? '#C89B5B' : '#A96A5F'}
                    />
                  </div>
                  <span className="text-[10px] text-[#77766F] uppercase tracking-wide flex-shrink-0">
                    {skill.category}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-6 text-center text-xs text-[#77766F] border border-[#383832] rounded-xl">
                  No skills in this category.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Skill Gaps */}
        <div>
          <div className="label mb-4">Skill Gaps</div>
          {skillGaps.length === 0 ? (
            <div className="border border-[#383832] rounded-xl p-5 text-center text-xs text-[#77766F]">
              No active skill gaps detected for your current profile.
            </div>
          ) : (
            <div className="space-y-4">
              {skillGaps.map((gap) => (
                <motion.div
                  key={gap.skill}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-[#383832] rounded-xl p-5"
                  style={{ borderLeftColor: PRIORITY_COLOR[gap.priority] || '#C89B5B', borderLeftWidth: 2 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-sm font-semibold text-[#F3F0E8]">{gap.skill}</div>
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest ml-2"
                      style={{ color: PRIORITY_COLOR[gap.priority] || '#C89B5B' }}
                    >
                      {gap.priority || 'HIGH'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#77766F]">Current</span>
                      <span className="text-[#AAA89F]">{gap.current || 0}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${gap.current || 0}%`, backgroundColor: '#C89B5B' }} />
                      <div
                        className="absolute top-0 w-px h-full bg-[#A96A5F]/60"
                        style={{ left: `${gap.required || 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#77766F]">Required</span>
                      <span className="text-[#AAA89F]">{gap.required || 100}%</span>
                    </div>
                  </div>

                  <div className="text-xs text-[#77766F] mb-3 leading-relaxed">
                    {gap.reason || 'Critical prerequisite for your roadmap.'}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate('/resources')}
                    icon={<ArrowRight size={12} />}
                  >
                    Find Resources
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
