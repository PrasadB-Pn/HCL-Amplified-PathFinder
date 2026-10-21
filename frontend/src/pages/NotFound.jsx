import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#171714] flex flex-col items-center justify-center p-8 text-center">
      <div className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#C89B5B] mb-8">RouteMaster</div>
      <div className="label mb-4">404</div>
      <h1 className="font-serif text-4xl text-[#F3F0E8] mb-4" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
        This route doesn't exist.
      </h1>
      <p className="text-[#AAA89F] mb-8 max-w-sm">
        Let's get you back to your learning journey.
      </p>
      <button
        onClick={() => navigate('/home')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#C89B5B] text-[#171714] text-sm font-semibold rounded-lg hover:bg-[#D4AA6C] transition-colors cursor-pointer"
      >
        Back to Overview <ArrowRight size={15} />
      </button>
    </div>
  );
}
