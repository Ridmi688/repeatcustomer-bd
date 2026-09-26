import { GeneratedCampaign } from '../types';
import { formatBdPhoneForWhatsApp } from './csvHelper';

// Cache for converted PNG blobs to ensure instantaneous repeat copying
const pngBlobCache = new Map<string, Blob>();

/**
 * Converts any image dataUrl (JPG, PNG, WEBP, etc.) into an image/png Blob
 * and copies it to the system clipboard using the standard Navigator Clipboard API.
 * Returns true if copied successfully, false if unsupported or failed.
 */
export async function copyImageToClipboardAsPng(dataUrl: string): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !navigator.clipboard ||
    typeof ClipboardItem === 'undefined' ||
    typeof navigator.clipboard.write !== 'function'
  ) {
    return false;
  }

  // Check cache first
  const cached = pngBlobCache.get(dataUrl);
  if (cached) {
    try {
      const item = new ClipboardItem({ 'image/png': cached });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.warn('Clipboard write with cached blob failed:', err);
      return false;
    }
  }

  return new Promise<boolean>((resolve) => {
    // Safety timeout in case image loading stalls
    const timeoutTimer = setTimeout(() => {
      resolve(false);
    }, 2500);

    try {
      // If already a PNG dataUrl, we can convert directly to Blob very fast
      if (dataUrl.startsWith('data:image/png;base64,')) {
        try {
          const byteCharacters = atob(dataUrl.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const pngBlob = new Blob([byteArray], { type: 'image/png' });
          pngBlobCache.set(dataUrl, pngBlob);

          const item = new ClipboardItem({ 'image/png': pngBlob });
          navigator.clipboard
            .write([item])
            .then(() => {
              clearTimeout(timeoutTimer);
              resolve(true);
            })
            .catch(() => {
              clearTimeout(timeoutTimer);
              resolve(false);
            });
          return;
        } catch {
          // Fall through to canvas rendering
        }
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 400;
          canvas.height = img.naturalHeight || img.height || 400;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            clearTimeout(timeoutTimer);
            resolve(false);
            return;
          }

          ctx.drawImage(img, 0, 0);

          canvas.toBlob(async (blob) => {
            clearTimeout(timeoutTimer);
            if (!blob) {
              resolve(false);
              return;
            }

            try {
              pngBlobCache.set(dataUrl, blob);
              const clipboardItem = new ClipboardItem({
                'image/png': blob,
              });
              await navigator.clipboard.write([clipboardItem]);
              resolve(true);
            } catch (err) {
              console.warn('Clipboard writeImage failed:', err);
              resolve(false);
            }
          }, 'image/png');
        } catch (canvasErr) {
          clearTimeout(timeoutTimer);
          console.warn('Canvas export failed:', canvasErr);
          resolve(false);
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutTimer);
        resolve(false);
      };

      img.src = dataUrl;
    } catch (e) {
      clearTimeout(timeoutTimer);
      console.warn('copyImageToClipboardAsPng error:', e);
      resolve(false);
    }
  });
}

/**
 * Fallback: triggers a quick download of the image file so the user can easily drag & drop it into WhatsApp
 */
export function triggerQuickDownload(dataUrl: string, filename: string = 'product_image.png') {
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download fallback failed:', err);
  }
}

export interface SendWithImageResult {
  copiedToClipboard: boolean;
  downloadTriggered: boolean;
}

/**
 * Handles the seamless "ছবি সহ পাঠান" workflow:
 * 1. Copies image to clipboard as PNG
 * 2. Shows instant toast notification: "ছবি ক্লিপবোর্ডে কপি হয়েছে! হোয়াটসঅ্যাপ খুলে চ্যাটে Ctrl+V (বা পেস্ট) চাপুন।"
 * 3. Immediately opens WhatsApp URL
 * 4. Falls back to quick download if clipboard write fails
 */
export async function executeSendWithImage(
  campaign: GeneratedCampaign,
  notifyToast: (message: string, type: 'success' | 'info' | 'warning') => void,
  onMarkSent?: () => void
): Promise<SendWithImageResult> {
  const waPhone = formatBdPhoneForWhatsApp(campaign.phone);
  const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(
    campaign.personalized_whatsapp_msg
  )}`;

  let copied = false;
  let downloaded = false;

  const media = campaign.mediaAttachment;

  if (media?.dataUrl) {
    if (media.type === 'image') {
      copied = await copyImageToClipboardAsPng(media.dataUrl);

      if (copied) {
        notifyToast(
          'ছবি ক্লিপবোর্ডে কপি হয়েছে! হোয়াটসঅ্যাপ খুলে চ্যাটে Ctrl+V (বা পেস্ট) চাপুন।',
          'success'
        );
      } else {
        // Fallback: trigger quick download
        triggerQuickDownload(media.dataUrl, media.name || 'product_image.png');
        downloaded = true;
        notifyToast(
          'ছবিটি ডাউনলোড হয়েছে! হোয়াটসঅ্যাপ চ্যাটে ড্র্যাগ করে ছেড়ে দিন বা পেস্ট করুন।',
          'info'
        );
      }
    } else {
      // Video
      triggerQuickDownload(media.dataUrl, media.name || 'product_video.mp4');
      downloaded = true;
      notifyToast(
        'ভিডিওটি ডাউনলোড হয়েছে! হোয়াটসঅ্যাপ চ্যাটে ড্র্যাগ করে সেন্ড করুন।',
        'info'
      );
    }
  }

  if (onMarkSent) {
    onMarkSent();
  }

  // Immediately open WhatsApp with the pre-filled message
  window.open(waUrl, '_blank');

  return { copiedToClipboard: copied, downloadTriggered: downloaded };
}
