import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, BookOpen, Video, FileText, Code, FolderOpen } from 'lucide-react';
import { TypeBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState, ErrorState, EmptyState } from '../components/common/States';
import { resourceService } from '../services/resourceService';

const TYPE_FILTERS = ['all', 'course', 'video', 'article', 'documentation', 'book', 'practice'];

const TYPE_ICON = {
  course: BookOpen,
  video: Video,
  article: FileText,
  documentation: Code,
  book: FileText,
  practice: Code,
  project: FolderOpen,
};

function ResourceCard({ resource, onClick, featured }) {
  const Icon = TYPE_ICON[resource.type] || FileText;

  if (featured) {
    return (
      <div className="border border-[#C89B5B]/30 bg-[#C89B5B]/5 rounded-xl p-6">
        <div className="label text-[#C89B5B] mb-3">Personalized for You</div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TypeBadge type={resource.type} />
              <span className="text-xs text-[#77766F]">{resource.duration}</span>
              <span className="text-xs text-[#77766F]">·</span>
              <span className="text-xs text-[#77766F]">{resource.level}</span>
            </div>
            <h3 className="text-base font-semibold text-[#F3F0E8] mb-1">{resource.title}</h3>
            {resource.subtitle && <p className="text-sm text-[#AAA89F] mb-3">{resource.subtitle}</p>}
          </div>
          <div className="ml-6 flex-shrink-0 text-right">
            <div className="text-xl font-semibold text-[#C89B5B]">{resource.relevance}%</div>
            <div className="text-[10px] text-[#77766F]">Route Relevance</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {resource.skills?.map((s) => (
            <span key={s} className="tag">{s}</span>
          ))}
        </div>

        {resource.description && (
          <p className="text-sm text-[#77766F] mb-4 leading-relaxed">
            Recommended because this is currently the primary skill gap blocking your next route stage.
          </p>
        )}

        <div className="flex gap-3">
          <Button size="sm" onClick={() => onClick(resource.id)} icon={<ArrowRight size={13} />}>
            Start Learning
          </Button>
          <Button size="sm" variant="secondary">Why recommended?</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(resource.id)}
      className="border border-[#383832] rounded-xl p-4 cursor-pointer hover:border-[#C89B5B]/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#22221E] border border-[#383832] flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-[#77766F]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TypeBadge type={resource.type} />
            <span className="text-[10px] text-[#77766F]">{resource.duration}</span>
          </div>
          <h4 className="text-sm font-medium text-[#F3F0E8] truncate">{resource.title}</h4>
          <div className="text-xs text-[#77766F] mt-0.5">{resource.level}</div>
        </div>
        <div className="flex-shrink-0">
          <ArrowRight size={13} className="text-[#383832]" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Resources() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await resourceService.getResources({ type: typeFilter === 'all' ? '' : typeFilter, q: search });
        setResources(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [typeFilter, search]);

  const featured = resources.find((r) => r.isCurrent);
  const others = resources.filter((r) => !r.isCurrent);

  if (loading) return <LoadingState message="Loading resources..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="label mb-3">Learning Resources</div>
        <h1 className="font-serif text-3xl text-[#F3F0E8] mb-2">Resources for your route</h1>
        <p className="text-[#AAA89F]">The right resource at the right stage — curated around your current skill gaps and goals.</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-[#22221E] border border-[#383832] rounded-xl px-4 py-3 mb-6">
        <Search size={16} className="text-[#77766F] flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-[#F3F0E8] placeholder-[#77766F] p-0"
        />
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
              typeFilter === t ? 'bg-[#C89B5B] text-[#171714]' : 'bg-[#22221E] border border-[#383832] text-[#77766F] hover:text-[#F3F0E8]'
            }`}
          >
            {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured && (
        <div className="mb-8">
          <ResourceCard
            resource={featured}
            featured
            onClick={(id) => navigate(`/resources/${id}`)}
          />
        </div>
      )}

      {/* Other resources */}
      <div>
        <div className="label mb-4">All Resources</div>
        {others.length === 0 ? (
          <EmptyState
            title="No resources found."
            description="Try adjusting your filters or search term."
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {others.map((r) => (
              <ResourceCard key={r.id} resource={r} onClick={(id) => navigate(`/resources/${id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Type overview */}
      <div className="mt-10 border-t border-[#383832] pt-8">
        <div className="label mb-4">Resource Types</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { type: 'course', label: 'Courses', count: 12, desc: 'Structured learning' },
            { type: 'video', label: 'Videos', count: 18, desc: 'Visual explanations' },
            { type: 'article', label: 'Articles', count: 24, desc: 'Focused concepts' },
            { type: 'documentation', label: 'Documentation', count: 9, desc: 'Deep references' },
            { type: 'practice', label: 'Practice', count: 14, desc: 'Hands-on learning' },
            { type: 'project', label: 'Projects', count: 6, desc: 'Build real things' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => setTypeFilter(item.type)}
              className="border border-[#383832] rounded-xl p-4 text-left hover:border-[#C89B5B]/30 transition-colors cursor-pointer"
            >
              <div className="text-sm font-medium text-[#F3F0E8]">{item.label}</div>
              <div className="text-xs text-[#77766F] mt-0.5">{item.desc}</div>
              <div className="text-lg font-semibold text-[#C89B5B] mt-2">{item.count}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
