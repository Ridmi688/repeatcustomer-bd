import React, { useState } from 'react';
import { GeneratedCampaign } from '../types';
import {
  formatBdPhoneForWhatsApp,
  exportBulkSmsCsv,
  exportFullReportCsv,
} from '../utils/csvHelper';
import { MediaShareModal } from './MediaShareModal';
import { GlobalTemplateBar } from './GlobalTemplateBar';
import { Toast, ToastData } from './Toast';
import { executeSendWithImage } from '../utils/whatsappImageHelper';
import {
  Send,
  Copy,
  Check,
  Download,
  Search,
  Filter,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
  Phone,
  Package,
  Calendar,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  CheckSquare,
  Square,
  BadgeCheck,
  Undo2,
} from 'lucide-react';

interface CampaignListProps {
  campaigns: GeneratedCampaign[];
  currentOffer?: string;
  onUpdateCampaign: (updated: GeneratedCampaign) => void;
  onUpdateMultipleCampaigns?: (updatedList: GeneratedCampaign[]) => void;
  onOpenBlast: () => void;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  currentOffer = '১০% স্পেশাল রিপিট ডিসকাউন্ট + ফ্রি ডেলিভারি',
  onUpdateCampaign,
  onUpdateMultipleCampaigns,
  onOpenBlast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'wa' | 'sms' | null>(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(campaigns.map((c) => c.id))
  );

  // Per-customer inline editing map to allow instant responsive typing without lag
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempWaText, setTempWaText] = useState<string>('');
  const [tempSmsText, setTempSmsText] = useState<string>('');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [mediaModalCampaign, setMediaModalCampaign] = useState<GeneratedCampaign | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [sendingImageId, setSendingImageId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success', duration = 6500) => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
      duration,
    });
  };

  // Sync selected IDs if new campaigns are loaded
  React.useEffect(() => {
    setSelectedIds(new Set(campaigns.map((c) => c.id)));
  }, [campaigns.length]);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.lastProduct.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = urgencyFilter === 'all' || c.reorder_urgency === urgencyFilter;
    return matchesSearch && matchesUrgency;
  });

  const handleCopy = (text: string, id: string, type: 'wa' | 'sms') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  // Toggle single customer selection
  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Master toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCampaigns.length && filteredCampaigns.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCampaigns.map((c) => c.id)));
    }
  };

  // Apply Global Template to all currently selected customers
  const handleApplyGlobalTemplate = (templateWa: string, templateSms: string) => {
    const updatedAll = campaigns.map((c) => {
      if (!selectedIds.has(c.id)) {
        return c;
      }

      // Dynamic shortcode replacement
      const rep = (str: string) =>
        str
          .replace(/{name}/gi, c.name)
          .replace(/{phone}/gi, c.phone)
          .replace(/{product}/gi, c.lastProduct)
          .replace(/{offer}/gi, currentOffer);

      return {
        ...c,
        personalized_whatsapp_msg: rep(templateWa),
        sms_version: rep(templateSms),
        isCustomized: false, // reset override tag if mass template applied
      };
    });

    if (onUpdateMultipleCampaigns) {
      onUpdateMultipleCampaigns(updatedAll);
    } else {
      updatedAll.forEach((c) => onUpdateCampaign(c));
    }
  };

  // Start individual customer editing
  const startIndividualEdit = (c: GeneratedCampaign) => {
    setEditingId(c.id);
    setTempWaText(c.personalized_whatsapp_msg);
    setTempSmsText(c.sms_version);
  };

  // Save individual customer edit
  const saveIndividualEdit = (c: GeneratedCampaign) => {
    onUpdateCampaign({
      ...c,
      personalized_whatsapp_msg: tempWaText,
      sms_version: tempSmsText,
      isCustomized: true, // mark as individually customized
    });
    setEditingId(null);
  };

  // Cancel edit
  const cancelIndividualEdit = () => {
    setEditingId(null);
  };

  const markSent = (c: GeneratedCampaign) => {
    onUpdateCampaign({
      ...c,
      status: c.status === 'sent' ? 'pending' : 'sent',
    });
  };

  // Seamless "ছবি সহ পাঠান" handler
  const handleSendWithImage = async (c: GeneratedCampaign) => {
    setSendingImageId(c.id);
    try {
      await executeSendWithImage(
        c,
        (msg, type) => showToast(msg, type),
        () => markSent(c)
      );
    } catch (err) {
      console.error('Send with image error:', err);
      // Fallback: directly open WhatsApp
      const waPhone = formatBdPhoneForWhatsApp(c.phone);
      const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(
        c.personalized_whatsapp_msg
      )}`;
      window.open(waUrl, '_blank');
      markSent(c);
    } finally {
      setSendingImageId(null);
    }
  };

  // Bulk Export for selected only
  const handleExportSelectedSms = () => {
    const selectedList = campaigns.filter((c) => selectedIds.has(c.id));
    if (selectedList.length === 0) {
      showToast('অনুগ্রহ করে কমপক্ষে একজন কাস্টমার সিলেক্ট করুন।', 'warning');
      return;
    }
    exportBulkSmsCsv(selectedList, `Selected_${selectedList.length}_BD_BulkSMS.csv`);
  };

  const isAllSelected =
    filteredCampaigns.length > 0 &&
    filteredCampaigns.every((c) => selectedIds.has(c.id));

  return (
    <div id="dashboard-results" className="space-y-5">
      {/* 1. Master Message / Global Broadcast Template Bar */}
      <GlobalTemplateBar
        selectedCount={selectedIds.size}
        totalCount={campaigns.length}
        currentOffer={currentOffer}
        onApplyTemplate={handleApplyGlobalTemplate}
      />

      {/* 2. Top Filter, Master Select & Action Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Search, Filter, Master Select */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Master Checkbox */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>সবাইকে সিলেক্ট করুন ({selectedIds.size}/{campaigns.length})</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="কাস্টমার নাম, ফোন বা পণ্য খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল তাগিদ ({campaigns.length})</option>
              <option value="High">উচ্চ তাগিদ (High)</option>
              <option value="Medium">মাঝারি তাগিদ (Medium)</option>
              <option value="Nurture">সম্পর্ক রক্ষা (Nurture)</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              কার্ড ভিউ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              টেবিল ভিউ
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div id="bulk-export" className="flex flex-wrap items-center gap-2">
          {/* Bulk Export Selected Only */}
          <button
            onClick={handleExportSelectedSms}
            disabled={selectedIds.size === 0}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
              selectedIds.size === 0
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title="শুধুমাত্র টিক দেওয়া কাস্টমারদের SMS CSV ডাউনলোড"
          >
            <Download className="w-3.5 h-3.5" />
            <span>সিলেক্টেড এক্সপোর্ট ({selectedIds.size})</span>
          </button>

          {/* Sequential Blast */}
          <button
            onClick={onOpenBlast}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            title="ধারাবাহিকভাবে WhatsApp এ পাঠানো শুরু করুন"
          >
            <Send className="w-3.5 h-3.5" />
            <span>১-ক্লিক WhatsApp ব্লাস্ট</span>
          </button>

          {/* Full SMS Export */}
          <button
            onClick={() => exportBulkSmsCsv(campaigns)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="সকল কাস্টমারের Bulk SMS CSV ডাউনলোড"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export All SMS</span>
          </button>

          {/* Full Report */}
          <button
            onClick={() => exportFullReportCsv(campaigns)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="পূর্ণাঙ্গ এক্সেল রিপোর্ট"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">ফুল রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* 3. Campaign List Render */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredCampaigns.map((c) => {
            const isEditing = editingId === c.id;
            const isSelected = selectedIds.has(c.id);
            const waPhone = formatBdPhoneForWhatsApp(c.phone);
            const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(
              c.personalized_whatsapp_msg
            )}`;
            const isSent = c.status === 'sent';

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                  isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                } ${isSent ? 'bg-emerald-50/10' : ''}`}
              >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(c.id)}
                        className="mt-0.5 text-emerald-600 hover:text-emerald-700 transition-transform active:scale-95"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{c.name}</h3>

                          {/* Customized Tag badge */}
                          {c.isCustomized && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <BadgeCheck className="w-3 h-3 text-purple-600" />
                              <span>কাস্টমাইজড (Customized)</span>
                            </span>
                          )}

                          {isSent && (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>পাঠানো হয়েছে</span>
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                              c.reorder_urgency === 'High'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : c.reorder_urgency === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {c.reorder_urgency === 'High'
                              ? 'উচ্চ তাগিদ (High)'
                              : c.reorder_urgency === 'Medium'
                              ? 'মাঝারি তাগিদ'
                              : 'রিলেশন নার্চার'}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-mono tabular-nums text-slate-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-700">{c.lastProduct}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{c.daysAgo} দিন আগে</span>
                        </div>
                      </div>
                    </div>

                    {/* Top right quick actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => markSent(c)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                          isSent
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={isSent ? 'মার্ক আন-সেন্ড করুন' : 'মার্ক সেন্ড করুন'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">{isSent ? 'সম্পন্ন' : 'মার্ক'}</span>
                      </button>

                      <button
                        onClick={() => (isEditing ? saveIndividualEdit(c) : startIndividualEdit(c))}
                        className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                          isEditing
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title={isEditing ? 'সংরক্ষণ করুন' : 'ব্যক্তিগত বার্তা কাস্টমাইজ করুন'}
                      >
                        {isEditing ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="font-bold text-[11px]">সংরক্ষণ</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[11px] hidden sm:inline">কাস্টমাইজ</span>
                          </>
                        )}
                      </button>

                      {isEditing && (
                        <button
                          onClick={cancelIndividualEdit}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="বাতিল করুন"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recommendations Meta */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>সেরা পাঠানোর সময়: </span>
                      <strong className="text-slate-800">{c.recommended_timing}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>প্রস্তাবিত রিফিল: </span>
                      <strong className="text-slate-800 truncate">{c.suggested_next_product}</strong>
                    </div>
                  </div>
                </div>

                {/* Body: WhatsApp Message Preview / Override editor */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Attached Media Thumbnail if present */}
                  {c.mediaAttachment && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {c.mediaAttachment.dataUrl ? (
                          <div className="w-12 h-10 rounded-md overflow-hidden bg-slate-800 shrink-0 border border-slate-300">
                            {c.mediaAttachment.type === 'video' ? (
                              <video src={c.mediaAttachment.dataUrl} className="w-full h-full object-cover" />
                            ) : (
                              <img src={c.mediaAttachment.dataUrl} alt="Product media" className="w-full h-full object-cover" />
                            )}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-800 truncate">
                            {c.mediaAttachment.name}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            মিডিয়া এটাচমেন্ট সক্রিয় ({c.mediaAttachment.type})
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMediaModalCampaign(c)}
                        className="text-[11px] text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md shrink-0 font-medium transition-colors"
                      >
                        ছবি সহ পাঠাতে দেখুন
                      </button>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>ব্যক্তিগতকৃত WhatsApp মেসেজ</span>
                        {isEditing && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            সম্পাদনা মোড
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(c.personalized_whatsapp_msg, c.id, 'wa')}
                        className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                      >
                        {copiedId === c.id && copiedType === 'wa' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* WhatsApp Chat Bubble style */}
                    <div className="bg-[#EFEAE2] p-3.5 rounded-xl border border-[#DFD8CC]">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            rows={6}
                            value={tempWaText}
                            onChange={(e) => setTempWaText(e.target.value)}
                            className="w-full text-xs font-sans p-2.5 rounded-lg border border-emerald-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs leading-relaxed"
                            placeholder="এই নির্দিষ্ট কাস্টমারের জন্য কাস্টম বার্তা লিখুন..."
                          />
                          <div className="flex justify-between items-center text-[11px] text-slate-500">
                            <span>💡 শুধুমাত্র {c.name}-এর জন্য আলাদা অফার বা বার্তা সেট হবে।</span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={cancelIndividualEdit}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded"
                              >
                                বাতিল
                              </button>
                              <button
                                type="button"
                                onClick={() => saveIndividualEdit(c)}
                                className="px-3 py-1 bg-emerald-600 text-white font-bold rounded shadow-2xs hover:bg-emerald-700"
                              >
                                সেভ করুন
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#DCF8C6] p-3 rounded-lg shadow-2xs text-xs text-slate-900 whitespace-pre-wrap leading-relaxed border border-[#CDE5B6] relative group">
                          {c.personalized_whatsapp_msg}
                          <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                            <span className="italic text-[10px] opacity-75">
                              {c.isCustomized ? 'সরাসরি কাস্টমাইজড বার্তা' : 'স্বয়ংক্রিয় পার্সোনালাইজড'}
                            </span>
                            <div className="flex items-center gap-1">
                              <span>{new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-emerald-700">✓✓</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SMS Version */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span>টেলিকম বাল্ক SMS ভার্সন</span>
                        <span
                          className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                            (isEditing ? tempSmsText.length : c.sms_version.length) > 160
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {(isEditing ? tempSmsText.length : c.sms_version.length)} / ১৬০ অক্ষর
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(c.sms_version, c.id, 'sms')}
                        className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                      >
                        {copiedId === c.id && copiedType === 'sms' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={tempSmsText}
                        onChange={(e) => setTempSmsText(e.target.value)}
                        className="w-full text-xs font-sans p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="কাস্টম SMS টেক্সট..."
                      />
                    ) : (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 leading-snug">
                        {c.sms_version}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 italic truncate max-w-xs">
                    💡 {c.psychological_hook}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(c.personalized_whatsapp_msg, c.id, 'wa')}
                      className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1"
                      title="মেসেজ কপি করুন"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">কপি করুন</span>
                    </button>

                    {c.mediaAttachment && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendWithImage(c)}
                          disabled={sendingImageId === c.id}
                          className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-98"
                          title="ছবি ক্লিপবোর্ডে কপি করে সরাসরি হোয়াটসঅ্যাপে পাঠান"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{sendingImageId === c.id ? 'কপি হচ্ছে...' : 'ছবি সহ পাঠান'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMediaModalCampaign(c)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                          title="ছবি ও বার্তা প্রিভিউ"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markSent(c)}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp এ পাঠান</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-emerald-600"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">কাস্টমার ও মোবাইল</th>
                  <th className="py-3 px-4">পূর্বের পণ্য</th>
                  <th className="py-3 px-4">WhatsApp মেসেজ প্রিভিউ</th>
                  <th className="py-3 px-4">SMS ভার্সন</th>
                  <th className="py-3 px-4">সময় ও তাগিদ</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCampaigns.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  const isEditing = editingId === c.id;
                  const waPhone = formatBdPhoneForWhatsApp(c.phone);
                  const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(
                    c.personalized_whatsapp_msg
                  )}`;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(c.id)}
                          className="text-emerald-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.isCustomized && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-full">
                              কাস্টমাইজড
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-slate-500 tabular-nums">{c.phone}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[140px] truncate" title={c.lastProduct}>
                        <div className="text-slate-800 font-medium truncate">{c.lastProduct}</div>
                        <div className="text-[11px] text-slate-500">{c.daysAgo} দিন আগে</div>
                      </td>
                      <td className="py-3 px-4 max-w-[300px]">
                        {isEditing ? (
                          <div className="space-y-1">
                            <textarea
                              rows={3}
                              value={tempWaText}
                              onChange={(e) => setTempWaText(e.target.value)}
                              className="w-full text-xs p-1.5 border border-emerald-400 rounded bg-white"
                            />
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={cancelIndividualEdit}
                                className="px-2 py-0.5 text-[10px] text-slate-600"
                              >
                                বাতিল
                              </button>
                              <button
                                onClick={() => saveIndividualEdit(c)}
                                className="px-2 py-0.5 text-[10px] bg-emerald-600 text-white rounded font-bold"
                              >
                                সেভ
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="line-clamp-2 text-slate-800 text-[11px]">
                              {c.personalized_whatsapp_msg}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                onClick={() => handleCopy(c.personalized_whatsapp_msg, c.id, 'wa')}
                                className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>কপি</span>
                              </button>
                              <button
                                onClick={() => startIndividualEdit(c)}
                                className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>এডিট</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[180px]">
                        <div className="line-clamp-2 text-slate-600 text-[11px]">{c.sms_version}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {c.sms_version.length} chars
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{c.recommended_timing}</div>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {c.reorder_urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {c.mediaAttachment && (
                            <button
                              type="button"
                              onClick={() => handleSendWithImage(c)}
                              disabled={sendingImageId === c.id}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg inline-flex items-center gap-1 shadow-2xs transition-colors"
                              title="ছবি ক্লিপবোর্ডে কপি করে সরাসরি হোয়াটসঅ্যাপে পাঠান"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{sendingImageId === c.id ? '...' : 'ছবি সহ'}</span>
                            </button>
                          )}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markSent(c)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Media Share Modal */}
      <MediaShareModal
        isOpen={!!mediaModalCampaign}
        onClose={() => setMediaModalCampaign(null)}
        campaign={mediaModalCampaign}
        onMarkSent={() => {
          if (mediaModalCampaign) markSent(mediaModalCampaign);
        }}
        onNotifyToast={showToast}
      />

      {/* Instant Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
