import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Check, Circle } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState, ErrorState } from '../components/common/States';
import { projectService } from '../services/projectService';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await projectService.getProjectById(projectId);
        if (mounted) {
          setProject(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load project details');
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
  }, [projectId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      if (projectService.startProject) {
        await projectService.startProject(projectId);
      }
      setProject((prev) => (prev ? { ...prev, status: 'current' } : prev));
    } catch {
      // Continue without breaking UI flow
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <LoadingState message="Loading project..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-[#77766F] hover:text-[#F3F0E8] mb-8 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} /> Back to Projects
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {project?.status === 'recommended' && (
          <div className="label text-[#C89B5B] mb-4">Recommended Project</div>
        )}

        <div className="flex items-start justify-between mb-4">
          <h1 className="font-serif text-3xl text-[#F3F0E8]">{project?.title}</h1>
          <StatusBadge status={project?.status} />
        </div>

        <p className="text-sm text-[#AAA89F] leading-relaxed mb-6">{project?.description}</p>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-4 border border-[#383832] rounded-xl p-5 mb-8">
          <div>
            <div className="label mb-1">Difficulty</div>
            <div className="text-sm text-[#F3F0E8]">{project?.difficulty}</div>
          </div>
          <div>
            <div className="label mb-1">Estimated</div>
            <div className="text-sm text-[#F3F0E8] flex items-center gap-1">
              <Clock size={12} />
              {project?.estimatedHours || project?.estimated_hours || 4}h
            </div>
          </div>
          <div>
            <div className="label mb-1">Route Stage</div>
            <div className="text-sm text-[#F3F0E8]">{project?.stage || 'Active'}</div>
          </div>
        </div>

        {/* Why this project */}
        {project?.why && (
          <div className="border border-[#C89B5B]/20 bg-[#C89B5B]/5 rounded-xl p-5 mb-8">
            <div className="label text-[#C89B5B] mb-2">Why This Project?</div>
            <p className="text-sm text-[#AAA89F] leading-relaxed">{project.why}</p>
          </div>
        )}

        {/* Skills */}
        {project?.skills?.length > 0 && (
          <div className="mb-8">
            <div className="label mb-3">Skills You'll Use</div>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        {project?.milestones && (
          <div className="mb-8">
            <div className="label mb-3">Project Milestones</div>
            <div className="space-y-2">
              {project.milestones.map((m) => (
                <div key={m.title} className="flex items-center gap-3 py-2 border-b border-[#383832] last:border-0">
                  {m.done ? (
                    <Check size={13} className="text-[#8C9A7A]" />
                  ) : (
                    <Circle size={13} className="text-[#383832]" />
                  )}
                  <span className={`text-sm ${m.done ? 'text-[#77766F] line-through' : 'text-[#AAA89F]'}`}>
                    {m.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button icon={<ArrowRight size={14} />} onClick={handleStart} loading={starting}>
            {project?.status === 'current' ? 'Continue Project' : 'Start Project'}
          </Button>
          {project?.url && (
            <Button
              variant="secondary"
              onClick={() => window.open(project.url, '_blank', 'noopener,noreferrer')}
            >
              View Repository
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
