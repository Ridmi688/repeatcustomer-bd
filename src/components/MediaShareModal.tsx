import React, { useState } from 'react';
import { GeneratedCampaign } from '../types';
import { formatBdPhoneForWhatsApp } from '../utils/csvHelper';
import { executeSendWithImage, triggerQuickDownload } from '../utils/whatsappImageHelper';
import { X, Send, Copy, Check, ExternalLink, Download, Image as ImageIcon, Video, ClipboardCheck, Info } from 'lucide-react';

interface MediaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: GeneratedCampaign | null;
  onMarkSent?: () => void;
  onNotifyToast?: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export const MediaShareModal: React.FC<MediaShareModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onMarkSent,
  onNotifyToast,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !campaign) return null;

  const waPhone = formatBdPhoneForWhatsApp(campaign.phone);
  const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(
    campaign.personalized_whatsapp_msg
  )}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(campaign.personalized_whatsapp_msg);
    setCopiedText(true);
    if (onNotifyToast) {
      onNotifyToast('বার্তা টেক্সট কপি হয়েছে!', 'success');
    }
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleDownloadMedia = () => {
    if (!campaign.mediaAttachment?.dataUrl) return;
    triggerQuickDownload(
      campaign.mediaAttachment.dataUrl,
      campaign.mediaAttachment.name || 'product_media'
    );
    if (onNotifyToast) {
      onNotifyToast('ছবিটি ডিভাইসে ডাউনলোড হয়েছে!', 'info');
    }
  };

  const handleSendSeamlessly = async () => {
    setIsSending(true);
    try {
      await executeSendWithImage(
        campaign,
        onNotifyToast || ((msg) => console.log(msg)),
        onMarkSent
      );
      onClose();
    } catch (err) {
      console.error('Seamless send error:', err);
      window.open(waUrl, '_blank');
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">WhatsApp এ ছবি সহ বার্তা পাঠান</h3>
              <p className="text-[11px] text-emerald-100">
                গ্রাহক: {campaign.name} ({campaign.phone})
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

        {/* Instructions Badge */}
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-6 py-3 flex items-start gap-2.5 text-xs text-emerald-950">
          <ClipboardCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <span>১-ক্লিক অটো কপি ও সেন্ড ফ্লো:</span>
              <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-mono text-[10px]">
                Ctrl + V
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-emerald-800 leading-snug">
              নিচের &apos;ছবি সহ পাঠান&apos; বাটনে চাপলেই পণ্যের ছবিটি আপনার ক্লিপবোর্ডে কপি হয়ে সাথে সাথে হোয়াটসঅ্যাপ খুলে যাবে। হোয়াটসঅ্যাপ চ্যাটে গিয়ে শুধু <strong>Ctrl + V</strong> (বা পেস্ট) চাপুন!
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Media Preview Box */}
          {campaign.mediaAttachment?.dataUrl && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="w-24 h-20 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300 flex items-center justify-center">
                {campaign.mediaAttachment.type === 'video' ? (
                  <video
                    src={campaign.mediaAttachment.dataUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={campaign.mediaAttachment.dataUrl}
                    alt="Media preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {campaign.mediaAttachment.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  টাইপ: {campaign.mediaAttachment.type.toUpperCase()} · সাইজ: {campaign.mediaAttachment.fileSize || 'Standard'}
                </div>
                <button
                  type="button"
                  onClick={handleDownloadMedia}
                  className="mt-2 text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ছবিটি ডিভাইসে ডাউনলোড করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>ব্যক্তিগতকৃত বাংলা বার্তা:</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'কপি সম্পন্ন!' : 'টেক্সট কপি'}</span>
              </button>
            </div>
            <div className="bg-[#EFEAE2] p-3.5 rounded-xl border border-[#DFD8CC]">
              <div className="bg-[#DCF8C6] p-3 rounded-lg shadow-2xs text-xs text-slate-900 whitespace-pre-wrap leading-relaxed border border-[#CDE5B6] max-h-40 overflow-y-auto">
                {campaign.personalized_whatsapp_msg}
              </div>
            </div>
          </div>

          {/* Action Step Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'টেক্সট কপি হয়েছে' : 'টেক্সট কপি'}</span>
            </button>

            <button
              type="button"
              disabled={isSending}
              onClick={handleSendSeamlessly}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>ছবি কপি ও WhatsApp খুলুন</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
