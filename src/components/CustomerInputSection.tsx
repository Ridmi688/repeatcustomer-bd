import React, { useState, useRef } from 'react';
import { Customer, CampaignConfig, CampaignGoal, CampaignTone, MediaAttachment } from '../types';
import { PRESET_DATASETS } from '../data/samplePresets';
import { parseCsvContent, parseExcelFile } from '../utils/csvHelper';
import { MediaAttachmentSection } from './MediaAttachmentSection';
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Layers,
  Store,
  Gift,
  HelpCircle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface CustomerInputSectionProps {
  config: CampaignConfig;
  onChangeConfig: (newConfig: CampaignConfig) => void;
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (c: Customer) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const CustomerInputSection: React.FC<CustomerInputSectionProps> = ({
  config,
  onChangeConfig,
  customers,
  onUpdateCustomers,
  onOpenAddModal,
  onOpenEditModal,
  onGenerate,
  isGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'paste'>('presets');
  const [pasteContent, setPasteContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    new Set(customers.map((c) => c.id))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selection when customers change
  React.useEffect(() => {
    setSelectedCustomerIds(new Set(customers.map((c) => c.id)));
  }, [customers.length]);

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_DATASETS.find((p) => p.id === presetId);
    if (preset) {
      onChangeConfig({ ...preset.config, mediaAttachment: config.mediaAttachment });
      onUpdateCustomers([...preset.customers]);
      setUploadStatus(null);
    }
  };

  const processFile = (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.txt');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          if (buffer) {
            const parsed = parseExcelFile(buffer);
            if (parsed.length > 0) {
              onUpdateCustomers(parsed);
              setUploadStatus(`সফলভাবে "${file.name}" থেকে ${parsed.length} জন কাস্টমার লোড হয়েছে!`);
            } else {
              alert('এক্সেল ফাইলটিতে কোনো গ্রহণযোগ্য কাস্টমার রো পাওয়া যায়নি।');
            }
          }
        } catch (err: any) {
          console.error('Error parsing Excel:', err);
          alert('এক্সেল ফাইল পার্সিংয়ে সমস্যা হয়েছে। অনুগ্রহ করে ফাইলের ফরম্যাট চেক করুন।');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (text) {
            const parsed = parseCsvContent(text);
            if (parsed.length > 0) {
              onUpdateCustomers(parsed);
              setUploadStatus(`সফলভাবে "${file.name}" থেকে ${parsed.length} জন কাস্টমার লোড হয়েছে!`);
            } else {
              alert('CSV ফাইলটিতে কোনো গ্রহণযোগ্য কাস্টমার রো পাওয়া যায়নি।');
            }
          }
        } catch (err: any) {
          console.error('Error parsing CSV:', err);
          alert('CSV ফাইল পার্সিংয়ে সমস্যা হয়েছে।');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) return;
    const parsed = parseCsvContent(pasteContent);
    if (parsed.length > 0) {
      onUpdateCustomers(parsed);
      setPasteContent('');
      setUploadStatus(`কুইক পেস্ট থেকে ${parsed.length} জন কাস্টমার যোগ করা হয়েছে!`);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    onUpdateCustomers(customers.filter((c) => c.id !== id));
  };

  const toggleSelectCustomer = (id: string) => {
    const next = new Set(selectedCustomerIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCustomerIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedCustomerIds.size === customers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(customers.map((c) => c.id)));
    }
  };

  const offerPresets = [
    '১০% স্পেশাল রিপিট ডিসকাউন্ট + ফ্রি ডেলিভারি (কুপন: BACK10)',
    'নতুন কালেকশনে আর্লি এক্সেস + ২০০৳ গিফট ভাউচার',
    'বাই ১ গেট ১ ফ্রি রিফিল অফার',
    'বিশেষ রি-অর্ডারে ফ্রি গিফট + ভিআইপি মেম্বারশিপ',
  ];

  return (
    <div className="space-y-6">
      {/* 1. Store Details & Campaign Strategy */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <Store className="w-5 h-5 text-emerald-600" />
          <h2>১. ব্র্যান্ড ও ক্যাম্পেইনের উদ্দেশ্য নির্ধারণ</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              শপ / ব্র্যান্ডের নাম
            </label>
            <input
              type="text"
              value={config.storeName}
              onChange={(e) => onChangeConfig({ ...config, storeName: e.target.value })}
              placeholder="যেমন: Aarong Touch, Pure Honey BD, Dhaka Dapper"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ব্যবসার ধরন বা ক্যাটাগরি
            </label>
            <input
              type="text"
              value={config.storeCategory}
              onChange={(e) => onChangeConfig({ ...config, storeCategory: e.target.value })}
              placeholder="যেমন: বিউটি ও স্কিনকেয়ার, শাড়ি ও বুটিক, অর্গানিক ফুড"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Offer Input with Quick Presets */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>রিপিট অফার বা প্রণোদনা (Offer / Incentive)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">আকর্ষণীয় অফারে রি-অর্ডার কনভার্সন দ্রুত বাড়ে</span>
          </label>
          <input
            type="text"
            value={config.offer}
            onChange={(e) => onChangeConfig({ ...config, offer: e.target.value })}
            placeholder="যেমন: ১০% স্পেশাল রিপিট ডিসকাউন্ট + ফ্রি ডেলিভারি"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {offerPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChangeConfig({ ...config, offer: preset })}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                  config.offer === preset
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Goal Selector */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            ক্যাম্পেইনের মূল লক্ষ্য (Campaign Goal)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, campaignGoal: 'replenishment' })}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.campaignGoal === 'replenishment'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>পণ্য রিস্টক / রি-অর্ডার</span>
                {config.campaignGoal === 'replenishment' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                পণ্য শেষ হওয়ার সময়মতো মনে করিয়ে দিয়ে পুনরায় কেনার তাগিদ (Skincare, Food, Daily Consumables)
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, campaignGoal: 'cross_sell' })}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.campaignGoal === 'cross_sell'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>নতুন কালেকশন ক্রস-সেল</span>
                {config.campaignGoal === 'cross_sell' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                পূর্বের পছন্দের সাথে মিলিয়ে ম্যাচিং নতুন কালেকশনে এক্সক্লুসিভ আর্লি এক্সেস (Fashion, Boutique, Gadgets)
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, campaignGoal: 'vip_appreciation' })}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.campaignGoal === 'vip_appreciation'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>ভিআইপি কাস্টমার সম্মাননা</span>
                {config.campaignGoal === 'vip_appreciation' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                পুরনো বিশ্বস্ত ক্রেতাদের আন্তরিক ধন্যবাদ ও বিশেষ উপহার দিয়ে স্থায়ী সম্পর্ক তৈরি
              </p>
            </button>
          </div>
        </div>

        {/* Tone Selector */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-700">মেসেজের শৈলী ও টোন:</div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, tone: 'polite_warm' })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                config.tone === 'polite_warm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              শ্রদ্ধাশীল ও মিষ্টি (ভাইয়া/আপু)
            </button>
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, tone: 'premium_vip' })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                config.tone === 'premium_vip'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              অভিজাত ও প্রিমিয়াম ভিআইপি
            </button>
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, tone: 'casual_friendly' })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                config.tone === 'casual_friendly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সহজ ও ফ্রেন্ডলি
            </button>
          </div>
        </div>

        {/* Media Attachment Section (Image / Video) */}
        <MediaAttachmentSection
          mediaAttachment={config.mediaAttachment}
          onChangeMedia={(media) => onChangeConfig({ ...config, mediaAttachment: media })}
          storeName={config.storeName}
          offerText={config.offer}
        />
      </div>

      {/* 2. Customer Ingestion Section */}
      <div id="customer-table" className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-slate-900 font-bold text-base">
              ২. পূর্বের ক্রেতাদের তালিকা ({customers.length} জন কাস্টমার)
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'presets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              রেডি ডেমো ডেটাসেট
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Excel / CSV আপলোড
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              কুইক পেস্ট
            </button>
          </div>
        </div>

        {/* Upload Success Alert */}
        {uploadStatus && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadStatus}</span>
            </div>
            <button
              onClick={() => setUploadStatus(null)}
              className="text-[11px] text-emerald-700 hover:underline"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              দ্রুত টেস্ট করতে আপনার নিশ অনুযায়ী একটি ডেমো সিলেক্ট করুন:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_DATASETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 text-left transition-all text-xs"
                >
                  <div className="font-bold text-slate-900 truncate">{preset.name.split('(')[0]}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">{preset.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Upload Excel / CSV */}
        {activeTab === 'upload' && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`mb-5 p-6 border-2 border-dashed rounded-xl text-center transition-colors ${
              dragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-800">
              Excel (.xlsx, .xls) অথবা CSV ফাইল ড্র্যাগ করুন অথবা ক্লিক করে ব্রাউজ করুন
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-lg mx-auto">
              স্বয়ংক্রিয়ভাবে চিহ্নিত হবে: <strong>নাম</strong> (Name/Customer), <strong>মোবাইল</strong> (Phone/Mobile), <strong>পণ্য</strong> (Product/Item), ও <strong>তারিখ</strong> (Date/দিন)। ফোন নম্বর স্বয়ংক্রিয়ভাবে ১১ ডিজিট (017XXXXXXXX) ফরম্যাটে কনভার্ট হয়।
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>এক্সেল বা CSV ফাইল নির্বাচন করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Quick Paste */}
        {activeTab === 'paste' && (
          <div className="mb-5 space-y-2">
            <textarea
              rows={4}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Name, Phone, Last Product, Days Ago&#10;তানভীন ইসলাম, 01711234567, ভিটামিন সি সিরাম, 42&#10;রুবাইয়া তাসনিম, 01819876543, কোরিয়ান সানস্ক্রিন, 30"
              className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
              >
                ডাটা লোড করুন
              </button>
            </div>
          </div>
        )}

        {/* Customer Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-700">
              <input
                type="checkbox"
                checked={selectedCustomerIds.size === customers.length && customers.length > 0}
                onChange={toggleSelectAll}
                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>সব সিলেক্ট করুন ({selectedCustomerIds.size}/{customers.length})</span>
            </div>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>কাস্টমার যোগ করুন</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">নাম</th>
                  <th className="py-2.5 px-3">মোবাইল</th>
                  <th className="py-2.5 px-3">পূর্বের পণ্য</th>
                  <th className="py-2.5 px-3">ক্রয়ের সময়কাল</th>
                  <th className="py-2.5 px-3 text-right">ভ্যালু</th>
                  <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      কোনো কাস্টমার যুক্ত নেই। উপরে ডেমো বা Excel/CSV আপলোড ব্যবহার করুন।
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const isSelected = selectedCustomerIds.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCustomer(c.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">{c.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 tabular-nums">{c.phone}</td>
                        <td className="py-2 px-3 text-slate-800 max-w-[180px] truncate" title={c.lastProduct}>
                          {c.lastProduct}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-slate-600">{c.daysAgo} দিন আগে</span>
                          {c.daysAgo >= 30 && (
                            <span className="ml-1.5 text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              রিফিল টাইম
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                          ৳{c.orderValue.toLocaleString('en-US')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(c)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="সম্পাদনা করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Primary Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Google <strong>gemini-3.8-flash</strong> মডেল প্রতিটি কাস্টমারের জন্য ব্যক্তিগত ও মার্জিত বার্তা তৈরি করবে
            </span>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || customers.length === 0}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              isGenerating || customers.length === 0
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-emerald-600/20'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>ক্যাম্পেইন তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ক্যাম্পেইন মেসেজ তৈরি করুন (Generate Re-Order Campaign)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

