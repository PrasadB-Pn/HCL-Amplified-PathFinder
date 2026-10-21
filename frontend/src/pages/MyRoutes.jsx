import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';
import { LoadingState, ErrorState, EmptyState } from '../components/common/States';
import { Modal } from '../components/common/Modal';
import { routeService } from '../services/routeService';
import { mockSharedSkills } from '../data/mockData';

function RouteProgressLine({ progress }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex-1 h-px bg-[#383832] relative">
        <div
          className="absolute top-0 left-0 h-full bg-[#C89B5B]"
          style={{ width: `${progress}%` }}
        />
        {/* Stage dots */}
        {[0, 25, 50, 75, 100].map((pos) => (
          <div
            key={pos}
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border"
            style={{
              left: `${pos}%`,
              borderColor: pos <= progress ? '#C89B5B' : '#383832',
              backgroundColor: pos <= progress ? '#C89B5B' : 'transparent',
              marginLeft: pos === 0 ? 0 : '-3px',
            }}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-[#C89B5B] flex-shrink-0">{progress}%</span>
    </div>
  );
}

function RouteCard({ route, isCurrent, onNavigate }) {
  const currentStage = route.currentStage || route.current_stage || 'Getting Started';
  const nextCheckpoint = route.nextCheckpoint || route.next_checkpoint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-6 ${isCurrent ? 'border-[#C89B5B]/30' : 'border-[#383832]'}`}
    >
      {isCurrent && (
        <div className="label text-[#C89B5B] mb-3">Current Focus</div>
      )}
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-[#F3F0E8]">{route.title}</h3>
        <span className="text-xs font-semibold text-[#8C9A7A] ml-4 flex-shrink-0">
          {(route.status || 'ACTIVE').toUpperCase()}
        </span>
      </div>

      <RouteProgressLine progress={route.progress ?? 0} />

      <div className="mt-4 space-y-1.5">
        <div className="flex gap-2 text-xs text-[#77766F]">
          <span className="text-[#AAA89F]">Current stage:</span> {currentStage}
        </div>
        {nextCheckpoint && (
          <div className="flex gap-2 text-xs text-[#77766F]">
            <span className="text-[#AAA89F]">Next checkpoint:</span> {nextCheckpoint}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5">
        <Button size="sm" onClick={() => onNavigate(route.id)} icon={<ArrowRight size={13} />}>
          {isCurrent ? 'Continue Route' : 'Open Route'}
        </Button>
      </div>
    </motion.div>
  );
}

export default function MyRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState(null);

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await routeService.getRoutes();
        if (mounted) {
          setRoutes(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message || 'Failed to load routes');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async () => {
    if (!goal.trim() || creating) return;
    setCreating(true);
    setModalError(null);
    try {
      const newRoute = await routeService.createRoute({ goal, career_title: goal });
      setRoutes((r) => [newRoute, ...r]);
      setCreateOpen(false);
      setGoal('');
      navigate(`/routes/${newRoute.id}`);
    } catch (err) {
      setModalError(err.response?.data?.detail || err.message || 'Failed to create route. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingState message="Loading your routes..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const currentRoute = routes.find((r) => r.isCurrent || r.is_current);
  const otherRoutes = routes.filter((r) => !(r.isCurrent || r.is_current));

  // Compute shared skills dynamically if user has 2 or more routes
  let computedShared = [];
  if (routes.length >= 2) {
    const skillToRoutes = {};
    routes.forEach((rt) => {
      const stages = rt.stages || [];
      stages.forEach((stg) => {
        const skills = stg.skills || [stg.title];
        skills.forEach((sk) => {
          if (!skillToRoutes[sk]) skillToRoutes[sk] = new Set();
          skillToRoutes[sk].add(rt.title);
        });
      });
    });
    computedShared = Object.entries(skillToRoutes)
      .filter(([, rts]) => rts.size > 1)
      .map(([skill, rts]) => ({ skill, routes: Array.from(rts) }))
      .slice(0, 6);
  } else if (isDemo) {
    computedShared = mockSharedSkills.slice(0, 4);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {isDemo && (
        <div className="mb-6 px-4 py-2 bg-[#C89B5B]/10 border border-[#C89B5B]/40 rounded-lg text-xs text-[#C89B5B]">
          DEMO MODE ACTIVE: Showing simulated route data.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="label mb-3">Your Learning Journeys</div>
          <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">My Routes</h1>
          <p className="text-[#AAA89F] text-sm">Different goals. Different journeys. One place to keep moving forward.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus size={14} />} size="sm">
          Create New Route
        </Button>
      </div>

      {routes.length === 0 ? (
        <EmptyState
          title="No learning routes yet."
          description="Tell RouteMaster what you want to become and we'll build your first route."
          action={<Button onClick={() => setCreateOpen(true)} icon={<Plus size={14} />}>Create New Route</Button>}
        />
      ) : (
        <div className="space-y-6">
          {/* Current route */}
          {currentRoute && (
            <RouteCard route={currentRoute} isCurrent onNavigate={(id) => navigate(`/routes/${id}`)} />
          )}

          {/* Other routes */}
          {otherRoutes.length > 0 && (
            <div>
              <div className="label mb-4">Other Routes</div>
              <div className="grid md:grid-cols-2 gap-4">
                {otherRoutes.map((r) => (
                  <RouteCard key={r.id} route={r} isCurrent={false} onNavigate={(id) => navigate(`/routes/${id}`)} />
                ))}
              </div>
            </div>
          )}

          {/* Shared skills */}
          {computedShared.length > 0 && (
            <div className="border-t border-[#383832] pt-8 mt-8">
              <div className="label mb-4">Shared Skills Across Routes</div>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {computedShared.map((item) => (
                  <div key={item.skill} className="border border-[#383832] rounded-lg px-4 py-3">
                    <div className="text-sm font-medium text-[#F3F0E8] mb-1">{item.skill}</div>
                    <div className="text-xs text-[#77766F]">Used in: {item.routes.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Route Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Route">
        <div className="space-y-5">
          {modalError && (
            <div className="p-3 bg-[#A96A5F]/10 border border-[#A96A5F]/40 rounded-lg text-xs text-[#A96A5F]">
              {modalError}
            </div>
          )}
          <div>
            <label className="label block mb-2">What do you want to become?</label>
            <input
              className="w-full bg-[#171714] border border-[#383832] rounded-lg px-4 py-2.5 text-sm text-[#F3F0E8] focus:border-[#C89B5B] focus:outline-none"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. AI / ML Engineer"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>
          <p className="text-xs text-[#77766F] leading-relaxed">
            RouteMaster will analyze your current skills and create a personalized learning route to reach your goal.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleCreate} loading={creating} fullWidth>
              Build This Route
            </Button>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
