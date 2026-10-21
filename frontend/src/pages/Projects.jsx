import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Circle } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';
import { LoadingState, ErrorState } from '../components/common/States';
import { projectService } from '../services/projectService';

function ProjectCard({ project, onClick }) {
  const borderColor = project.status === 'current' ? '#C89B5B' : project.status === 'recommended' ? '#C89B5B' : '#383832';
  const statusIcon = project.status === 'completed' ? <Check size={14} className="text-[#8C9A7A]" /> :
    project.status === 'current' ? <ArrowRight size={14} className="text-[#C89B5B]" /> :
    <Circle size={14} className="text-[#383832]" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-xl p-5 cursor-pointer hover:border-opacity-60 transition-all"
      style={{ borderColor }}
      onClick={() => onClick(project.id)}
    >
      {project.status === 'recommended' && (
        <div className="label text-[#C89B5B] mb-3">Recommended Project</div>
      )}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{statusIcon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#F3F0E8]">{project.title}</h3>
          </div>
          <StatusBadge status={project.status} />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.skills?.slice(0, 4).map((s) => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-[#77766F]">
            <span>{project.difficulty}</span>
            <span>·</span>
            <span>~{project.estimatedHours}h</span>
            <span>·</span>
            <span>{project.stage}</span>
          </div>

          {/* Milestones for current */}
          {project.status === 'current' && project.milestones && (
            <div className="mt-4 space-y-1.5">
              {project.milestones.map((m) => (
                <div key={m.title} className="flex items-center gap-2">
                  {m.done ? (
                    <Check size={11} className="text-[#8C9A7A]" />
                  ) : (
                    <Circle size={11} className="text-[#383832]" />
                  )}
                  <span className={`text-xs ${m.done ? 'text-[#77766F] line-through' : 'text-[#AAA89F]'}`}>{m.title}</span>
                </div>
              ))}
            </div>
          )}

          {project.why && (
            <p className="text-xs text-[#77766F] mt-3 leading-relaxed">{project.why}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState message="Loading projects..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const routeProjects = projects.filter((p) => p.status !== 'recommended');
  const recommended = projects.filter((p) => p.status === 'recommended');

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-10">
        <div className="label mb-3">Projects</div>
        <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">Build Along Your Route</h1>
        <p className="text-[#AAA89F]">Projects at each stage reinforce skills and produce real evidence of capability.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="label mb-2">Projects Along Your Route</div>
          {routeProjects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} onClick={(id) => navigate(`/projects/${id}`)} />
          ))}
        </div>

        <div className="space-y-6">
          {recommended.map((proj) => (
            <ProjectCard key={proj.id} project={proj} onClick={(id) => navigate(`/projects/${id}`)} />
          ))}

          {/* Route connection note */}
          <div className="border border-[#383832] rounded-xl p-5">
            <div className="label mb-2 text-[#C89B5B]">RouteMaster</div>
            <p className="text-sm text-[#AAA89F] leading-relaxed">
              Projects are placed at specific route stages to reinforce skills at the moment you need them most.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
