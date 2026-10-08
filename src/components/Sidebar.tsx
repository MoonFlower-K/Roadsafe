import React from 'react';
import { ShieldCheck, BarChart3, Crosshair } from 'lucide-react';

interface SidebarProps {
  currentPage: 'overview' | 'predict';
  onNavigate: (page: 'overview' | 'predict') => void;
  hasModel: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  hasModel,
}) => {
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-[#EBEAE5] min-h-screen flex flex-col justify-between py-6 px-4">
      <div className="space-y-8">
        {/* Brand / Logo */}
        <div className="px-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1F2421] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[#557A66]" />
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-[#1F2421] block leading-tight">
              ROADSAFE
            </span>
            <span className="text-[11px] text-[#717672] tracking-wider uppercase">
              STATS19 ML Predictor
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => onNavigate('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              currentPage === 'overview'
                ? 'bg-[#F2F1EC] text-[#1F2421]'
                : 'text-[#616662] hover:bg-[#FAF9F5] hover:text-[#1F2421]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#557A66]" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => {
              if (hasModel) onNavigate('predict');
            }}
            disabled={!hasModel}
            title={!hasModel ? 'Upload a dataset first to enable predictions' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              !hasModel
                ? 'opacity-40 cursor-not-allowed text-[#8F9490]'
                : currentPage === 'predict'
                ? 'bg-[#F2F1EC] text-[#1F2421]'
                : 'text-[#616662] hover:bg-[#FAF9F5] hover:text-[#1F2421]'
            }`}
          >
            <Crosshair className="w-4 h-4 text-[#C98A3C]" />
            <span>Predict Severity</span>
          </button>
        </nav>
      </div>

      {/* Dataset / Engine Footer Status */}
      <div className="px-3 pt-4 border-t border-[#EBEAE5] text-xs text-[#717672]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${hasModel ? 'bg-[#557A66]' : 'bg-[#C98A3C]'}`} />
          <span className="font-medium text-[#1F2421]">
            {hasModel ? 'Model Trained & Ready' : 'Dataset Required'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#8F9490] leading-relaxed">
          UK STATS19 2025 Collision Standard
        </p>
      </div>
    </aside>
  );
};
