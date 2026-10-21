import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { LoadingState, ErrorState } from '../components/common/States';
import { progressService } from '../services/progressService';
import { routeService } from '../services/routeService';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#292923] border border-[#383832] rounded-lg px-3 py-2 text-xs">
        <div className="text-[#77766F]">{label}</div>
        <div className="text-[#C89B5B] font-medium">{payload[0].value}</div>
      </div>
    );
  }
  return null;
};

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    (async () => {
      try {
        const [progressData, routesData] = await Promise.all([
          progressService.getProgress(),
          routeService.getRoutes().catch(() => []),
        ]);
        setProgress(progressData);
        setRoutes(Array.isArray(routesData) ? routesData : []);
      } catch (e) {
        setError(e.message || 'Unable to load progress data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState message="Loading your progress..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const displayRoutes = routes.length > 0 ? routes : (isDemo ? [
    { id: 'r1', title: 'AI / ML Engineer', progress: 68 },
    { id: 'r2', title: 'Software Dev Engineer', progress: 42 },
    { id: 'r3', title: 'Generative AI Engineer', progress: 21 },
  ] : []);

  const overall = progress?.overall ?? 0;
  const skillsCompleted = progress?.skillsCompleted ?? progress?.skills_completed ?? 0;
  const totalSkills = progress?.totalSkills ?? progress?.total_skills ?? 0;
  const coursesCompleted = progress?.coursesCompleted ?? progress?.courses_completed ?? 0;
  const projectsCompleted = progress?.projectsCompleted ?? progress?.projects_completed ?? 0;
  const thisWeekHours = progress?.thisWeekHours ?? progress?.this_week_hours ?? 0;
  const streak = progress?.streak ?? 0;
  const weeklyActivity = progress?.weeklyActivity ?? progress?.weekly_activity ?? [];
  const skillProgression = progress?.skillProgression ?? progress?.skill_progression ?? [];
  const currentSkill = progress?.currentSkill ?? progress?.current_skill ?? 'Foundations';
  const nextSkill = progress?.nextSkill ?? progress?.next_skill ?? 'Upcoming Milestone';
  const currentProject = progress?.currentProject ?? progress?.current_project ?? 'Active Route Project';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {isDemo && (
        <div className="mb-6 px-4 py-2 bg-[#C89B5B]/10 border border-[#C89B5B]/30 rounded-lg text-xs text-[#C89B5B]">
          <strong>Demo Mode Active:</strong> Displaying simulated progress.
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="label mb-3">Your Progress</div>
        <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">See how far you've come.</h1>
        <p className="text-[#AAA89F]">Track milestones and verified skill progression along your route.</p>
      </motion.div>

      {/* Overview metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Overall Progress', value: `${overall}%`, color: '#C89B5B' },
          { label: 'Skills Completed', value: `${skillsCompleted} / ${totalSkills || '—'}`, color: '#F3F0E8' },
          { label: 'Courses Done', value: coursesCompleted, color: '#8C9A7A' },
          { label: 'Projects Done', value: projectsCompleted, color: '#8C9A7A' },
        ].map((m) => (
          <div key={m.label} className="border border-[#383832] rounded-xl p-5">
            <div className="text-2xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-[#77766F] uppercase tracking-wide">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Weekly activity */}
        <div>
          <div className="label mb-4">Weekly Activity</div>
          <div className="border border-[#383832] rounded-xl p-5">
            <div className="mb-4">
              <div className="text-2xl font-semibold text-[#F3F0E8]">{thisWeekHours}h</div>
              <div className="text-xs text-[#77766F]">This week · {streak} day streak</div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyActivity} barSize={16}>
                <XAxis dataKey="day" tick={{ fill: '#77766F', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" fill="#C89B5B" radius={[2, 2, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill progression */}
        <div>
          <div className="label mb-4">Skill Progression</div>
          <div className="border border-[#383832] rounded-xl p-5">
            <div className="mb-4">
              <div className="text-2xl font-semibold text-[#F3F0E8]">{skillsCompleted}</div>
              <div className="text-xs text-[#77766F]">Skills acquired so far</div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={skillProgression}>
                <XAxis dataKey="month" tick={{ fill: '#77766F', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="skills"
                  stroke="#C89B5B"
                  strokeWidth={1.5}
                  dot={{ fill: '#C89B5B', strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current + Next */}
        <div>
          <div className="label mb-4">Current Focus</div>
          <div className="border border-[#383832] rounded-xl divide-y divide-[#383832]">
            <div className="px-5 py-4">
              <div className="text-[10px] text-[#C89B5B] uppercase tracking-widest mb-1">Current Skill</div>
              <div className="text-base font-semibold text-[#F3F0E8]">{currentSkill}</div>
            </div>
            <div className="px-5 py-4">
              <div className="text-[10px] text-[#77766F] uppercase tracking-widest mb-1">Next Checkpoint</div>
              <div className="text-base text-[#AAA89F]">{nextSkill}</div>
            </div>
            <div className="px-5 py-4">
              <div className="text-[10px] text-[#77766F] uppercase tracking-widest mb-1">Current Project</div>
              <div className="text-sm text-[#AAA89F]">{currentProject}</div>
            </div>
          </div>
        </div>

        {/* Route completion */}
        <div>
          <div className="label mb-4">Route Completion</div>
          <div className="border border-[#383832] rounded-xl p-5 space-y-4">
            {displayRoutes.length === 0 ? (
              <div className="text-xs text-[#77766F]">No active routes yet. Start one from My Routes.</div>
            ) : (
              displayRoutes.map((r, idx) => (
                <div key={r.id || idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#F3F0E8]">{r.title}</span>
                    <span className="text-xs font-medium text-[#C89B5B]">{r.progress || 0}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${r.progress || 0}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      style={{ backgroundColor: '#C89B5B' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
