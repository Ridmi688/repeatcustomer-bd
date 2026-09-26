/**
 * Generates high-fidelity product images and promo graphics as data URLs (PNG)
 * for instant testing of the "Send with Image to WhatsApp" feature in RepeatCustomer BD.
 */

export interface SampleProductImage {
  id: string;
  title: string;
  category: string;
  name: string;
  dataUrl: string;
}

// Generate a clean product mockup canvas and export as PNG dataUrl
export function createProductMockupDataUrl(
  productName: string,
  categoryName: string,
  badgeText: string,
  colorScheme: { bg1: string; bg2: string; accent: string; icon: string }
): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 600, 600);
  grad.addColorStop(0, colorScheme.bg1);
  grad.addColorStop(1, colorScheme.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 600);

  // Decorative soft circles
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(100, 100, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(520, 500, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, 560, 560);

  // Category Tag badge
  ctx.fillStyle = colorScheme.accent;
  roundRect(ctx, 50, 50, 160, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(categoryName, 130, 74);

  // Center visual card
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 120, 130, 360, 310, 24);
  ctx.fill();
  ctx.restore();

  // Inner icon / illustration
  ctx.font = '85px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(colorScheme.icon, 300, 260);

  // Special Offer badge ribbon
  ctx.fillStyle = '#E11D48'; // Rose red
  roundRect(ctx, 160, 395, 280, 44, 22);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(badgeText, 300, 423);

  // Product Name Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(productName, 300, 495);

  // Subtitle call to action
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '15px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
  ctx.fillText('রিপিট অর্ডারে বিশেষ ছাড় ও ফ্রি ডেলিভারি', 300, 530);

  return canvas.toDataURL('image/png');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Built-in presets for instant 1-click test
export const SAMPLE_PRODUCT_IMAGES = [
  {
    id: 'sample_skincare',
    title: 'ভিটামিন সি সিরাম',
    category: 'Skincare',
    name: 'vitamin_c_serum.png',
    badge: '★ ১০% ছাড় + ফ্রি ডেলিভারি',
    colors: { bg1: '#0F766E', bg2: '#042F2E', accent: '#0D9488', icon: '🧴' },
  },
  {
    id: 'sample_saree',
    title: 'ঢাকাই জামদানি শাড়ি',
    category: 'Fashion',
    name: 'dhakai_jamdani.png',
    badge: '★ নতুন ফেস্টিভ কালেকশন',
    colors: { bg1: '#831843', bg2: '#500724', accent: '#BE185D', icon: '👗' },
  },
  {
    id: 'sample_honey',
    title: 'সুন্দরবনের খাঁটি মধু',
    category: 'Food',
    name: 'pure_honey.png',
    badge: '★ ১ কেজি রিফিল বিশেষ অফার',
    colors: { bg1: '#B45309', bg2: '#78350F', accent: '#D97706', icon: '🍯' },
  },
  {
    id: 'sample_gadget',
    title: 'স্মার্ট অডিও এয়ারবাডস',
    category: 'Gadgets',
    name: 'smart_earbuds.png',
    badge: '★ ভিআইপি গ্রাহক উপহার',
    colors: { bg1: '#1E293B', bg2: '#0F172A', accent: '#3B82F6', icon: '🎧' },
  },
];
