import React from 'react';
import { RefreshCw, MessageSquareShare, Sparkles } from 'lucide-react';

interface NavbarProps {
  onReset: () => void;
  onOpenBlast?: () => void;
  hasCampaigns: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset, onOpenBlast, hasCampaigns }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <a href="/" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              RepeatCustomer BD
            </a>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              বাংলাদেশি ই-কমার্স ও এফ-কমার্স রি-অর্ডার ইঞ্জিন
            </p>
          </div>
        </div>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#campaign-inputs" className="hover:text-emerald-700 transition-colors">
            ক্যাম্পেইন সেটআপ
          </a>
          <a href="#customer-table" className="hover:text-emerald-700 transition-colors">
            কাস্টমার ডাটা
          </a>
          <a href="#dashboard-results" className="hover:text-emerald-700 transition-colors">
            মেসেজ ড্যাশবোর্ড
          </a>
          <a href="#bulk-export" className="hover:text-emerald-700 transition-colors">
            SMS এক্সপোর্ট
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {hasCampaigns && onOpenBlast && (
            <button
              onClick={onOpenBlast}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <MessageSquareShare className="w-3.5 h-3.5" />
              <span>১-ক্লিক WhatsApp ব্লাস্ট</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            title="নতুন ক্যাম্পেইন শুরু করুন"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>নতুন ক্যাম্পেইন</span>
          </button>
        </div>
      </div>
    </header>
  );
};
