import React, { useState } from 'react';
import { Customer, CampaignConfig, GeneratedCampaign } from './types';
import { PRESET_DATASETS } from './data/samplePresets';
import { Navbar } from './components/Navbar';
import { RoiBanner } from './components/RoiBanner';
import { CustomerInputSection } from './components/CustomerInputSection';
import { MetricsCards } from './components/MetricsCards';
import { CampaignList } from './components/CampaignList';
import { CustomerModal } from './components/CustomerModal';
import { WhatsAppBlastModal } from './components/WhatsAppBlastModal';
import { createProductMockupDataUrl, SAMPLE_PRODUCT_IMAGES } from './utils/sampleImages';
import { AlertCircle, CheckCircle, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const defaultPreset = PRESET_DATASETS[0];

  const [config, setConfig] = useState<CampaignConfig>({ ...defaultPreset.config });
  const [customers, setCustomers] = useState<Customer[]>([...defaultPreset.customers]);
  const [campaigns, setCampaigns] = useState<GeneratedCampaign[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize sample product image on first load so users can test "Send with Image" immediately
  React.useEffect(() => {
    const sample = SAMPLE_PRODUCT_IMAGES[0];
    const dataUrl = createProductMockupDataUrl(
      sample.title,
      sample.category,
      sample.badge,
      sample.colors
    );
    if (dataUrl) {
      setConfig((prev) => ({
        ...prev,
        mediaAttachment: {
          name: sample.name,
          type: 'image',
          dataUrl,
          fileSize: '450 KB',
        },
      }));
    }
  }, []);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isBlastModalOpen, setIsBlastModalOpen] = useState(false);

  // Auto-generate on first mount for instant demo satisfaction or merchant can click
  const handleGenerate = async () => {
    if (customers.length === 0) {
      setError('অনুগ্রহ করে কমপক্ষে একজন কাস্টমার যোগ করুন।');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeName: config.storeName,
          storeCategory: config.storeCategory,
          offer: config.offer,
          campaignGoal: config.campaignGoal,
          tone: config.tone,
          mediaAttachment: config.mediaAttachment ? {
            name: config.mediaAttachment.name,
            type: config.mediaAttachment.type,
            publicUrl: config.mediaAttachment.publicUrl || '',
            fileSize: config.mediaAttachment.fileSize,
            dataUrl: config.mediaAttachment.dataUrl,
          } : null,
          customers,
        }),
      });

      if (!response.ok) {
        throw new Error(`সার্ভার থেকে ত্রুটি এসেছে: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
        setSuccessMsg(
          data.source === 'gemini-3.8-flash'
            ? 'গুগল Gemini 3.8 Flash মডেল সফলভাবে সকল কাস্টমারের জন্য পার্সোনালাইজড মেসেজ তৈরি করেছে!'
            : 'সফলভাবে চমৎকার রিপিট ক্যাম্পেইন মেসেজ তৈরি হয়েছে!'
        );

        // Smooth scroll to results
        setTimeout(() => {
          document.getElementById('dashboard-results')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        throw new Error('ক্যাম্পেইন ডাটা পাওয়া যায়নি।');
      }
    } catch (err: any) {
      console.error('Failed to generate campaign:', err);
      setError(err?.message || 'ক্যাম্পেইন তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    const first = PRESET_DATASETS[0];
    const sample = SAMPLE_PRODUCT_IMAGES[0];
    const dataUrl = createProductMockupDataUrl(
      sample.title,
      sample.category,
      sample.badge,
      sample.colors
    );
    setConfig({
      ...first.config,
      mediaAttachment: {
        name: sample.name,
        type: 'image',
        dataUrl,
        fileSize: '450 KB',
      },
    });
    setCustomers([...first.customers]);
    setCampaigns([]);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSaveCustomer = (cust: Customer) => {
    if (editingCustomer) {
      setCustomers(customers.map((c) => (c.id === cust.id ? cust : c)));
    } else {
      setCustomers([...customers, cust]);
    }
    setEditingCustomer(null);
  };

  const handleUpdateCampaign = (updated: GeneratedCampaign) => {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleUpdateMultipleCampaigns = (updatedList: GeneratedCampaign[]) => {
    setCampaigns(updatedList);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <Navbar
        onReset={handleReset}
        onOpenBlast={() => setIsBlastModalOpen(true)}
        hasCampaigns={campaigns.length > 0}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner with ROI context */}
        <RoiBanner />

        {/* Status Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Input & Customer Ingestion Section */}
        <div id="campaign-inputs">
          <CustomerInputSection
            config={config}
            onChangeConfig={setConfig}
            customers={customers}
            onUpdateCustomers={setCustomers}
            onOpenAddModal={() => {
              setEditingCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            onOpenEditModal={(c) => {
              setEditingCustomer(c);
              setIsCustomerModalOpen(true);
            }}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Results Dashboard */}
        {campaigns.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  ৩. ক্যাম্পেইন ফলাফল ও রিপিট মেসেজ ড্যাশবোর্ড
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  প্রতিটি গ্রাহকের জন্য আলাদাভাবে তৈরি করা হোয়াটসঅ্যাপ ও টেলিকম এসএমএস বার্তা
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  মডেল: <strong className="text-slate-800">gemini-3.8-flash</strong>
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>পুনরায় জেনারেট করুন</span>
                </button>
              </div>
            </div>

            {/* Metrics cards */}
            <MetricsCards campaigns={campaigns} />

            {/* Campaign Cards / Table with 1-tap WhatsApp and SMS Copy */}
            <CampaignList
              campaigns={campaigns}
              currentOffer={config.offer}
              onUpdateCampaign={handleUpdateCampaign}
              onUpdateMultipleCampaigns={handleUpdateMultipleCampaigns}
              onOpenBlast={() => setIsBlastModalOpen(true)}
            />
          </div>
        )}

        {/* Empty state prompt if no campaigns generated yet */}
        {campaigns.length === 0 && !isGenerating && (
          <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">ক্যাম্পেইন মেসেজ এখনও তৈরি করা হয়নি</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              উপরের ফর্ম থেকে আপনার ব্র্যান্ডের নাম, বিশেষ অফার ও কাস্টমার তালিকা ঠিক করে &apos;ক্যাম্পেইন মেসেজ তৈরি করুন&apos; বাটনে ক্লিক করুন।
            </p>
            <button
              onClick={handleGenerate}
              className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>এখনই ডেমো ক্যাম্পেইন জেনারেট করুন</span>
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
      />

      {/* Sequential WhatsApp Blast Modal */}
      <WhatsAppBlastModal
        isOpen={isBlastModalOpen}
        onClose={() => setIsBlastModalOpen(false)}
        campaigns={campaigns}
        onUpdateCampaign={handleUpdateCampaign}
      />
    </div>
  );
}
