import React, { useState } from 'react';
import { GeneratedCampaign } from '../types';
import { formatBdPhoneForWhatsApp } from '../utils/csvHelper';
import { executeSendWithImage } from '../utils/whatsappImageHelper';
import { X, Send, ChevronRight, ChevronLeft, Check, SkipForward, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface WhatsAppBlastModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: GeneratedCampaign[];
  onUpdateCampaign: (campaign: GeneratedCampaign) => void;
}

export const WhatsAppBlastModal: React.FC<WhatsAppBlastModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  onUpdateCampaign,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || campaigns.length === 0) return null;

  const current = campaigns[currentIndex] || campaigns[0];
  const waPhone = formatBdPhoneForWhatsApp(current.phone);
  const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(
    current.personalized_whatsapp_msg
  )}`;

  const [blastToast, setBlastToast] = useState<string | null>(null);

  const handleSendAndNext = async () => {
    if (current.mediaAttachment?.dataUrl) {
      await executeSendWithImage(
        current,
        (msg) => {
          setBlastToast(msg);
          setTimeout(() => setBlastToast(null), 4000);
        }
      );
    } else {
      // Open WhatsApp
      window.open(waUrl, '_blank');
    }

    // Mark as sent
    onUpdateCampaign({
      ...current,
      status: 'sent',
    });

    // Advance
    if (currentIndex < campaigns.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < campaigns.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const completedCount = campaigns.filter((c) => c.status === 'sent').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="text-base font-bold">১-ক্লিক WhatsApp ব্লাস্ট অ্যাসিস্ট্যান্ট</h3>
              <p className="text-[11px] text-emerald-100">
                এক ক্লিকে হোয়াটসঅ্যাপে বার্তা পাঠান ও ক্রমান্বয়ে পরবর্তী কাস্টমারে যান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-100 px-6 py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-200">
          <div>
            অগ্রগতি: <strong className="text-slate-900 tabular-nums">{completedCount} / {campaigns.length}</strong> পাঠানো হয়েছে
          </div>
          <div className="font-mono tabular-nums text-slate-500">
            কাস্টমার {currentIndex + 1} / {campaigns.length}
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">{current.name}</div>
              <div className="text-xs font-mono text-slate-600 tabular-nums">{current.phone}</div>
              <div className="text-xs text-slate-500 mt-1">
                পূর্বের পণ্য: <strong className="text-slate-700">{current.lastProduct}</strong> ({current.daysAgo} দিন আগে)
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  current.status === 'sent'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {current.status === 'sent' ? '✓ সম্পন্ন হয়েছে' : 'পেন্ডিং'}
              </span>
              <div className="text-[11px] text-slate-500 mt-2">
                টাইমিং: {current.recommended_timing}
              </div>
            </div>
          </div>

          {/* WhatsApp Preview */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>প্রস্তুতকৃত WhatsApp বার্তা:</span>
              {current.mediaAttachment && (
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  📸 {current.mediaAttachment.type === 'video' ? 'ভিডিও' : 'ছবি'} সংযুক্ত: {current.mediaAttachment.name}
                </span>
              )}
            </div>
            <div className="bg-[#EFEAE2] p-4 rounded-xl border border-[#DFD8CC]">
              <div className="bg-[#DCF8C6] p-3 rounded-lg shadow-2xs text-xs text-slate-900 whitespace-pre-wrap leading-relaxed border border-[#CDE5B6]">
                {current.personalized_whatsapp_msg}
              </div>
            </div>
            {current.mediaAttachment?.dataUrl && (
              <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>ছবি সংযুক্ত করতে: WhatsApp উইন্ডো খোলার পর ছবিটি ড্র্যাগ বা পেস্ট (Ctrl+V) করুন।</span>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="পূর্ববর্তী"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentIndex === campaigns.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(campaigns.length - 1, prev + 1))}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="পরবর্তী"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 ml-1"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>স্কিপ করুন</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {blastToast && (
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg animate-pulse">
                  ✓ {blastToast}
                </div>
              )}
              <button
                type="button"
                onClick={handleSendAndNext}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {current.mediaAttachment?.dataUrl
                    ? 'ছবি কপি ও WhatsApp এ পাঠান'
                    : 'WhatsApp এ পাঠান ও পরবর্তী যান'}
                </span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
