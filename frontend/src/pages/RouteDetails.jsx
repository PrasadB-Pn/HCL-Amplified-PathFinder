import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, Check, Circle, Clock, BookOpen, Wrench } from 'lucide-react';
import {
  ReactFlow, Background, Controls, useNodesState, useEdgesState,
  Handle, Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '../components/common/Button';
import { LoadingState, ErrorState } from '../components/common/States';
import { Drawer } from '../components/common/Modal';
import { routeService } from '../services/routeService';
import { resourceService } from '../services/resourceService';
import { projectService } from '../services/projectService';

// Custom route node for React Flow
function RouteNode({ data }) {
  const statusColors = {
    completed: '#8C9A7A',
    current: '#C89B5B',
    upcoming: '#383832',
    goal: '#C89B5B',
  };
  const color = statusColors[data.status] || '#383832';

  return (
    <div
      onClick={() => data.onNodeClick && data.onNodeClick(data)}
      className="cursor-pointer px-4 py-3 rounded-lg border transition-all"
      style={{
        minWidth: 160,
        backgroundColor: data.status === 'current' ? '#C89B5B10' : '#22221E',
        borderColor: color,
        borderWidth: data.isGoal ? 2 : 1,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ borderColor: color, background: '#171714' }} />
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor: data.status === 'completed' ? color : 'transparent',
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: color,
          }}
        />
        <span className="text-xs font-semibold" style={{ color: data.status === 'upcoming' ? '#77766F' : '#F3F0E8' }}>
          {data.label}
        </span>
      </div>
      {data.status === 'current' && (
        <div className="mt-1.5 ml-4">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-[#C89B5B]">Current</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ borderColor: color, background: '#171714' }} />
    </div>
  );
}

const nodeTypes = { routeNode: RouteNode };

function StageAccordion({ stage, isExpanded, onToggle, onContinue }) {
  const statusColor = {
    completed: '#8C9A7A',
    current: '#C89B5B',
    upcoming: '#77766F',
  }[stage.status] || '#77766F';

  const completedSkills = stage.completedSkills || stage.completed_skills || [];
  const currentSkill = stage.currentSkill || stage.current_skill;
  const upcomingSkills = stage.upcomingSkills || stage.upcoming_skills || [];
  const estimatedMinutes = stage.estimatedMinutes || stage.estimated_minutes;

  return (
    <div className={`border rounded-xl overflow-hidden ${stage.status === 'current' ? 'border-[#C89B5B]/30' : 'border-[#383832]'}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-[#22221E]/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[#77766F] font-medium w-6">{stage.number}</span>
          <div>
            <div className="text-sm font-semibold text-[#F3F0E8]">{stage.title}</div>
            <div className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: statusColor }}>
              {stage.status}
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-[#77766F]" /> : <ChevronDown size={14} className="text-[#77766F]" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[#383832]">
              {completedSkills.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] text-[#8C9A7A] uppercase tracking-widest mb-2">Completed</div>
                  {completedSkills.map((s) => (
                    <div key={s} className="flex items-center gap-2 py-1.5">
                      <Check size={12} className="text-[#8C9A7A]" />
                      <span className="text-sm text-[#AAA89F]">{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {currentSkill && (
                <div className="mt-4">
                  <div className="text-[10px] text-[#C89B5B] uppercase tracking-widest mb-2">Current</div>
                  <div className="flex items-center gap-2 py-1.5">
                    <ArrowRight size={12} className="text-[#C89B5B]" />
                    <span className="text-sm text-[#F3F0E8]">{currentSkill}</span>
                    {estimatedMinutes ? (
                      <span className="text-xs text-[#77766F] flex items-center gap-1">
                        <Clock size={10} />~{estimatedMinutes} min
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
              {upcomingSkills.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] text-[#77766F] uppercase tracking-widest mb-2">Upcoming</div>
                  {upcomingSkills.map((s) => (
                    <div key={s} className="flex items-center gap-2 py-1.5">
                      <Circle size={10} className="text-[#383832]" />
                      <span className="text-sm text-[#77766F]">{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {stage.status === 'current' && (
                <div className="mt-5">
                  <Button size="sm" icon={<ArrowRight size={13} />} onClick={onContinue}>
                    Continue Learning
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RouteDetails() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStage, setExpandedStage] = useState(null);
  const [view, setView] = useState('timeline');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerNode, setDrawerNode] = useState(null);
  const [recommendedResources, setRecommendedResources] = useState([]);
  const [recommendedProjects, setRecommendedProjects] = useState([]);

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleNodeClick = useCallback((nodeData) => {
    setDrawerNode(nodeData);
    setDrawerOpen(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [routeData, resourcesData, projectsData] = await Promise.all([
          routeService.getRouteById(routeId),
          resourceService.getResources().catch(() => []),
          projectService.getProjects().catch(() => []),
        ]);
        if (mounted) {
          setRoute(routeData);
          setRecommendedResources(resourcesData || []);
          setRecommendedProjects(projectsData || []);
          if (routeData?.stages?.length > 0) {
            const curStage = routeData.stages.find((s) => s.status === 'current');
            setExpandedStage(curStage?.id || routeData.stages[0].id);
          }
        }
      } catch (e) {
        if (mounted) {
          setError(e.message || 'Failed to load route details');
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
  }, [routeId]);

  useEffect(() => {
    if (route?.stages && route.stages.length > 0) {
      const generatedNodes = route.stages.map((stage, idx) => ({
        id: stage.id || `stage-${idx}`,
        type: 'routeNode',
        position: { x: 100, y: idx * 100 },
        data: {
          label: stage.title,
          status: stage.status,
          stage,
          isGoal: idx === route.stages.length - 1,
          onNodeClick: handleNodeClick,
        },
      }));

      const generatedEdges = [];
      for (let i = 0; i < generatedNodes.length - 1; i++) {
        generatedEdges.push({
          id: `e-${generatedNodes[i].id}-${generatedNodes[i + 1].id}`,
          source: generatedNodes[i].id,
          target: generatedNodes[i + 1].id,
          style: { stroke: '#383832', strokeWidth: 1 },
        });
      }
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    }
  }, [route, handleNodeClick, setNodes, setEdges]);

  if (loading) return <LoadingState message="Loading your route..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const stagesList = route?.stages || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {isDemo && (
        <div className="mb-6 px-4 py-2 bg-[#C89B5B]/10 border border-[#C89B5B]/40 rounded-lg text-xs text-[#C89B5B] flex items-center justify-between">
          <span>DEMO MODE ACTIVE: Showing simulated route data.</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="label mb-3">My Learning Route</div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl text-[#F3F0E8] mb-1">Your Route</h1>
            <p className="text-sm text-[#AAA89F]">A personalized sequence designed to take you from your current skills to your goal.</p>
          </div>
        </div>
      </div>

      {/* Goal card */}
      <div className="border border-[#C89B5B]/20 rounded-xl p-5 mb-8 flex items-center justify-between">
        <div>
          <div className="label text-[#C89B5B] mb-1">Destination</div>
          <div className="text-base font-semibold text-[#F3F0E8]">{route?.title}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-[#C89B5B]">{route?.progress ?? 0}%</div>
          <div className="text-xs text-[#77766F]">Complete</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Stages', value: route?.totalStages ?? route?.total_stages ?? stagesList.length },
          { label: 'Skills', value: route?.totalSkills ?? route?.total_skills ?? stagesList.length },
          { label: 'Projects', value: route?.totalProjects ?? route?.total_projects ?? recommendedProjects.length },
        ].map((s) => (
          <div key={s.label} className="border border-[#383832] rounded-xl p-4 text-center">
            <div className="text-2xl font-semibold text-[#F3F0E8]">{s.value}</div>
            <div className="text-xs text-[#77766F] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-[#22221E] border border-[#383832] rounded-lg w-fit mb-8">
        {['timeline', 'roadmap'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded text-xs font-medium capitalize transition-all cursor-pointer ${
              view === v ? 'bg-[#C89B5B] text-[#171714]' : 'text-[#77766F] hover:text-[#F3F0E8]'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'timeline' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: stages */}
          <div className="lg:col-span-2 space-y-3">
            {stagesList.length === 0 ? (
              <div className="border border-[#383832] rounded-xl p-8 text-center text-sm text-[#77766F]">
                No stages found for this route.
              </div>
            ) : (
              stagesList.map((stage) => (
                <StageAccordion
                  key={stage.id}
                  stage={stage}
                  isExpanded={expandedStage === stage.id}
                  onToggle={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  onContinue={() => navigate('/resources')}
                />
              ))
            )}

            {/* Destination */}
            {stagesList.length > 0 && (
              <div className="border-2 border-[#C89B5B]/40 rounded-xl px-5 py-4 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-[#C89B5B] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C89B5B]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#C89B5B] uppercase tracking-widest font-semibold">Destination</div>
                  <div className="text-sm font-semibold text-[#F3F0E8]">{route?.title}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: resources & projects */}
          <div className="space-y-6">
            <div>
              <div className="label mb-3 flex items-center gap-2">
                <BookOpen size={12} /> Recommended Resources
              </div>
              <div className="space-y-2">
                {recommendedResources.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate('/resources')}
                    className="w-full text-left border border-[#383832] rounded-lg px-4 py-3 hover:border-[#C89B5B]/30 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-medium text-[#F3F0E8]">{r.title}</div>
                    <div className="text-[10px] text-[#77766F] mt-1">
                      {r.type || 'Course'} {r.level ? `· ${r.level}` : ''}
                    </div>
                  </button>
                ))}
                {recommendedResources.length === 0 && (
                  <div className="text-xs text-[#77766F] p-4 border border-[#383832] rounded-lg">
                    No resources currently loaded.
                  </div>
                )}
              </div>
            </div>

            {recommendedProjects.length > 0 && (
              <div>
                <div className="label mb-3 flex items-center gap-2">
                  <Wrench size={12} /> Recommended Project
                </div>
                <div
                  onClick={() => navigate('/projects')}
                  className="border border-[#383832] rounded-lg px-4 py-3 cursor-pointer hover:border-[#C89B5B]/30 transition-colors"
                >
                  <div className="text-xs font-semibold text-[#F3F0E8]">{recommendedProjects[0].title}</div>
                  <div className="text-[10px] text-[#77766F] mt-1">
                    {recommendedProjects[0].difficulty} · {recommendedProjects[0].skills?.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'roadmap' && (
        <div className="border border-[#383832] rounded-xl overflow-hidden" style={{ height: 600 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            style={{ background: '#171714' }}
          >
            <Background color="#383832" gap={24} size={1} variant="dots" />
            <Controls style={{ background: '#22221E', border: '1px solid #383832' }} />
          </ReactFlow>
        </div>
      )}

      {/* Node Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerNode?.label || 'Stage Detail'}>
        {drawerNode && (
          <div className="space-y-6">
            <div>
              <div className="text-xl font-semibold text-[#F3F0E8] mb-1">{drawerNode.label}</div>
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: drawerNode.status === 'completed' ? '#8C9A7A' : drawerNode.status === 'current' ? '#C89B5B' : '#77766F' }}
              >
                {drawerNode.status}
              </div>
            </div>

            {drawerNode.status !== 'completed' && (
              <div className="border border-[#C89B5B]/20 rounded-lg px-4 py-3">
                <div className="label text-[#A96A5F] mb-1">Target Skill</div>
                <div className="text-sm text-[#AAA89F]">Focus on mastering {drawerNode.label} for this stage.</div>
              </div>
            )}

            <div>
              <div className="label mb-3">Recommended Resources</div>
              {recommendedResources.slice(0, 2).map((r) => (
                <div key={r.id} className="border border-[#383832] rounded-lg px-4 py-3 mb-2">
                  <div className="text-sm text-[#F3F0E8]">{r.title}</div>
                  <div className="text-xs text-[#77766F] mt-0.5">{r.level || 'All levels'} · {r.type || 'Course'}</div>
                </div>
              ))}
              {recommendedResources.length === 0 && (
                <div className="text-xs text-[#77766F]">No resources available.</div>
              )}
            </div>

            {recommendedProjects.length > 0 && (
              <div>
                <div className="label mb-3">Recommended Project</div>
                <div className="border border-[#383832] rounded-lg px-4 py-3">
                  <div className="text-sm text-[#F3F0E8]">{recommendedProjects[0].title}</div>
                  <div className="text-xs text-[#77766F] mt-0.5">
                    {recommendedProjects[0].difficulty} · {recommendedProjects[0].estimatedHours || 6} hours
                  </div>
                </div>
              </div>
            )}

            <Button fullWidth icon={<ArrowRight size={14} />} onClick={() => navigate('/resources')}>
              Start Learning
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
