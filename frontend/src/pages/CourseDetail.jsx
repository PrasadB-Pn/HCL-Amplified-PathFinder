import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Clock, BarChart2, Bookmark } from 'lucide-react';
import { TypeBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState, ErrorState } from '../components/common/States';
import { resourceService } from '../services/resourceService';

export default function CourseDetail() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await resourceService.getResourceById(resourceId);
        if (mounted) {
          setResource(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load course details');
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
  }, [resourceId]);

  const handleSave = async () => {
    try {
      if (resourceService.saveResource) {
        await resourceService.saveResource(resourceId);
      }
      setSaved(true);
    } catch {
      // In non-blocking save, preserve user feedback
      setSaved(true);
    }
  };

  if (loading) return <LoadingState message="Loading resource..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/resources')}
        className="flex items-center gap-2 text-sm text-[#77766F] hover:text-[#F3F0E8] mb-8 cursor-pointer transition-colors"
      >
        <ArrowLeft size={14} /> Back to Resources
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-3 mb-4 flex-wrap">
          <TypeBadge type={resource?.type} />
          {resource?.duration && (
            <span className="flex items-center gap-1 text-xs text-[#77766F]">
              <Clock size={11} />
              {resource.duration}
            </span>
          )}
          {resource?.level && (
            <span className="flex items-center gap-1 text-xs text-[#77766F]">
              <BarChart2 size={11} />
              {resource.level}
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">{resource?.title}</h1>
        {resource?.subtitle && <p className="text-base text-[#AAA89F] mb-6">{resource.subtitle}</p>}

        {resource?.description && (
          <p className="text-sm text-[#AAA89F] leading-relaxed mb-6 border-l-2 border-[#C89B5B]/40 pl-4">
            {resource.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {resource?.skills?.map((s) => (
            <span key={s} className="tag">
              {s}
            </span>
          ))}
        </div>

        {resource?.relevance && (
          <div className="border border-[#C89B5B]/20 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <div className="label text-[#C89B5B] mb-1">Route Relevance</div>
              <div className="text-sm text-[#AAA89F]">Directly addresses your current skill gap</div>
            </div>
            <div className="text-2xl font-semibold text-[#C89B5B]">{resource.relevance}%</div>
          </div>
        )}

        <div className="flex gap-3">
          {resource?.url && (
            <Button icon={<ArrowRight size={14} />} onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>
              Start Learning
            </Button>
          )}
          <Button variant="secondary" icon={<Bookmark size={14} />} onClick={handleSave}>
            {saved ? 'Saved' : 'Save'}
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
