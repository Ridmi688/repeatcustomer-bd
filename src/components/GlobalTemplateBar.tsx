import React, { useState } from 'react';
import { Sparkles, Check, Info, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface GlobalTemplateBarProps {
  selectedCount: number;
  totalCount: number;
  currentOffer: string;
  onApplyTemplate: (templateWa: string, templateSms: string) => void;
}

export const GlobalTemplateBar: React.FC<GlobalTemplateBarProps> = ({
  selectedCount,
  totalCount,
  currentOffer,
  onApplyTemplate,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [waTemplate, setWaTemplate] = useState<string>(
    `আসসালামু আলাইকুম {name} ভাইয়া/আপু! আশা করি ভালো আছেন। 😊\n\nকিছুদিন আগে আমাদের শপ থেকে নেওয়া আপনার "{product}" কেমন উপভোগ করছেন?\n\nআপনার জন্য আমাদের বিশেষ রিপিট অফার: {offer}।\n\nসহজে রি-অর্ডার কনফার্ম করতে এই মেসেজেই সরাসরি রিপ্লাই করতে পারেন। ধন্যবাদ! 🌸`
  );
  const [smsTemplate, setSmsTemplate] = useState<string>(
    `প্রিয় {name}, আপনার "{product}" কি শেষের পথে? পান স্পেশাল অফার: {offer}। বিস্তারিত ও অর্ডারে রিপ্লাই দিন: {phone}`
  );
  const [justApplied, setJustApplied] = useState(false);

  const insertTag = (tag: string, target: 'wa' | 'sms') => {
    if (target === 'wa') {
      setWaTemplate((prev) => prev + tag);
    } else {
      setSmsTemplate((prev) => prev + tag);
    }
  };

  const handleApply = () => {
    if (!waTemplate.trim()) return;
    onApplyTemplate(waTemplate, smsTemplate);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50/90 via-slate-50 to-emerald-50/50 rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Master Message / গ্লোবাল মেসেজ টেমপ্লেট
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                {selectedCount} / {totalCount} কাস্টমার সিলেক্টেড
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              সকল বা নির্বাচিত কাস্টমারদের জন্য একসাথে একই স্ট্যান্ডার্ড বার্তা ডায়নামিক ট্যাগসহ প্রয়োগ করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isOpen ? 'সংক্ষিপ্ত করুন' : 'টেমপ্লেট বক্স খুলুন'}</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedCount === 0}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
              selectedCount === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : justApplied
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white'
            }`}
          >
            {justApplied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>প্রয়োগ সফল হয়েছে!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>সকল সিলেক্টেড কাস্টমারে প্রয়োগ করুন ({selectedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3.5 border-t border-emerald-100 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">
          {/* WhatsApp Template Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>WhatsApp গ্লোবাল ফরম্যাট</span>
              </label>

              {/* Dynamic tag inserters */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 mr-0.5">ট্যাগ যোগ:</span>
                {['{name}', '{product}', '{offer}', '{phone}'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag, 'wa')}
                    className="text-[10px] font-mono bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 px-1.5 py-0.5 rounded transition-colors"
                    title={`মেসেজে ${tag} ট্যাগ বসান`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={waTemplate}
              onChange={(e) => setWaTemplate(e.target.value)}
              className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs leading-relaxed"
              placeholder="WhatsApp মেসেজ টেমপ্লেট..."
            />
          </div>

          {/* SMS Template Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>টেলিকম Bulk SMS গ্লোবাল ফরম্যাট</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  ({smsTemplate.length} chars)
                </span>
              </label>

              {/* Dynamic tag inserters */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400 mr-0.5">ট্যাগ যোগ:</span>
                {['{name}', '{product}', '{offer}', '{phone}'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag, 'sms')}
                    className="text-[10px] font-mono bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 px-1.5 py-0.5 rounded transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
              className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs leading-relaxed"
              placeholder="Bulk SMS টেমপ্লেট..."
            />
          </div>
        </div>
      )}
    </div>
  );
};
