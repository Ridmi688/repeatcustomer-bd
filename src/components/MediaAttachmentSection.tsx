import React, { useRef, useState } from 'react';
import { MediaAttachment } from '../types';
import {
  SAMPLE_PRODUCT_IMAGES,
  createProductMockupDataUrl,
} from '../utils/sampleImages';
import { copyImageToClipboardAsPng } from '../utils/whatsappImageHelper';
import {
  Image as ImageIcon,
  Video,
  X,
  UploadCloud,
  Link as LinkIcon,
  AlertCircle,
  Info,
  Sparkles,
  Check,
  ClipboardCopy,
  ExternalLink,
} from 'lucide-react';

interface MediaAttachmentSectionProps {
  mediaAttachment: MediaAttachment | null | undefined;
  onChangeMedia: (media: MediaAttachment | null) => void;
  storeName?: string;
  offerText?: string;
}

export const MediaAttachmentSection: React.FC<MediaAttachmentSectionProps> = ({
  mediaAttachment,
  onChangeMedia,
  storeName = 'আমাদের শপ',
  offerText = '১০% স্পেশাল রিপিট ডিসকাউন্ট',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedQuick, setCopiedQuick] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে।');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('শুধুমাত্র ছবি (JPG, PNG, WEBP) অথবা ভিডিও (MP4, WEBM) ফাইল আপলোড করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      onChangeMedia({
        name: file.name,
        type: isVideo ? 'video' : 'image',
        dataUrl,
        publicUrl: mediaAttachment?.publicUrl || '',
        fileSize: sizeStr,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemove = () => {
    onChangeMedia(null);
  };

  const handlePublicUrlChange = (url: string) => {
    if (mediaAttachment) {
      onChangeMedia({
        ...mediaAttachment,
        publicUrl: url,
      });
    } else if (url.trim()) {
      onChangeMedia({
        name: 'অনলাইন মিডিয়া লিঙ্ক',
        type: 'image',
        publicUrl: url.trim(),
      });
    }
  };

  // Select one of the curated sample product images
  const handleSelectSampleImage = (sample: (typeof SAMPLE_PRODUCT_IMAGES)[0]) => {
    const dataUrl = createProductMockupDataUrl(
      sample.title,
      sample.category,
      sample.badge,
      sample.colors
    );

    onChangeMedia({
      name: sample.name,
      type: 'image',
      dataUrl,
      publicUrl: mediaAttachment?.publicUrl || '',
      fileSize: '450 KB',
    });
  };

  // Generate dynamic custom promo banner with current storeName & offer
  const handleGenerateCustomBanner = () => {
    const dataUrl = createProductMockupDataUrl(
      storeName,
      'স্পেশাল অফার',
      offerText.slice(0, 30),
      {
        bg1: '#047857',
        bg2: '#064E3B',
        accent: '#10B981',
        icon: '🎁',
      }
    );

    onChangeMedia({
      name: `${storeName.replace(/\s+/g, '_')}_offer_banner.png`,
      type: 'image',
      dataUrl,
      publicUrl: mediaAttachment?.publicUrl || '',
      fileSize: '480 KB',
    });
  };

  // Copy attached image to clipboard directly from preview
  const handleQuickCopyClipboard = async () => {
    if (!mediaAttachment?.dataUrl) return;
    const ok = await copyImageToClipboardAsPng(mediaAttachment.dataUrl);
    if (ok) {
      setCopiedQuick(true);
      setTimeout(() => setCopiedQuick(false), 2000);
    }
  };

  return (
    <div className="mt-5 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span>মিডিয়া এটাচমেন্ট (পণ্যের ছবি বা ভিডিও প্রিভিউ)</span>
          <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            ঐচ্ছিক (Optional)
          </span>
        </label>
        {mediaAttachment && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>মুছে ফেলুন</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
        অফার বা নতুন পণ্যের ছবি (JPG/PNG) বা ছোট ভিডিও (MP4) যুক্ত করুন। হোয়াটসঅ্যাপ চ্যাটে গ্রাহককে ছবি সহ পাঠাতে সরাসরি ক্লিপবোর্ড কপি ও অটো-লিংক সহায়তা পাবেন।
      </p>

      {/* Upload Box / Active Preview */}
      {!mediaAttachment?.dataUrl ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* File Upload Trigger */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[110px]"
            >
              <UploadCloud className="w-6 h-6 text-slate-400 mb-1.5" />
              <div className="text-xs font-semibold text-slate-700">
                ছবি বা ভিডিও ফাইল আপলোড করুন
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP বা MP4 (সর্বোচ্চ 10MB)</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Online Public URL Option */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-center">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>বা ফেসবুক/ওয়েবসাইট ছবির লিঙ্ক দিন (Public URL)</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/product-image.jpg"
                value={mediaAttachment?.publicUrl || ''}
                onChange={(e) => handlePublicUrlChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1">
                লিঙ্ক দিলে এটি স্বয়ংক্রিয়ভাবে হোয়াটসঅ্যাপ মেসেজের শেষে যুক্ত হবে।
              </span>
            </div>
          </div>

          {/* Quick Sample Image Selection */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>দ্রুত টেস্ট করতে নমুনা পণ্যের ছবি বেছে নিন:</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateCustomBanner}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-0.5 rounded-md transition-colors flex items-center gap-1"
              >
                <span>🎨 অটো অফার ব্যানার তৈরি করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRODUCT_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSampleImage(sample)}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all text-left flex items-center gap-2 group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 shadow-2xs"
                    style={{ background: sample.colors.bg1 }}
                  >
                    {sample.colors.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-emerald-700">
                      {sample.title}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">
                      {sample.category}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Preview Card */
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300 flex items-center justify-center shadow-xs">
            {mediaAttachment.type === 'video' ? (
              <video
                src={mediaAttachment.dataUrl}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <img
                src={mediaAttachment.dataUrl}
                alt={mediaAttachment.name}
                className="w-full h-full object-cover"
              />
            )}
            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold">
              {mediaAttachment.type}
            </span>
          </div>

          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 truncate max-w-xs">
                  {mediaAttachment.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  সাইজ: {mediaAttachment.fileSize || 'Attached'} · ফরম্যাট: {mediaAttachment.type.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {mediaAttachment.type === 'image' && (
                  <button
                    type="button"
                    onClick={handleQuickCopyClipboard}
                    className="text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                    title="ছবি সরাসরি ক্লিপবোর্ডে কপি করুন"
                  >
                    {copiedQuick ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ClipboardCopy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedQuick ? 'কপিকৃত!' : 'ক্লিপবোর্ডে কপি'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-emerald-700 hover:underline px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs"
                >
                  পরিবর্তন করুন
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Optional Public Link input alongside file */}
            <div>
              <input
                type="url"
                placeholder="ঐচ্ছিক অনলাইন লিঙ্ক (যেমন: https://yourshop.com/product)"
                value={mediaAttachment.publicUrl || ''}
                onChange={(e) => handlePublicUrlChange(e.target.value)}
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Helper note */}
            <div className="text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                হোয়াটসঅ্যাপে পাঠানোর সময় &apos;ছবি সহ পাঠান&apos; ফিচারের মাধ্যমে ১-ক্লিকে বার্তা ও ছবি স্বয়ংক্রিয়ভাবে প্রস্তুত পাবেন।
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
