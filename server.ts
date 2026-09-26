import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to sanitize Bangladeshi phone numbers
function sanitizeBdPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('88')) {
    cleaned = cleaned.slice(2);
  }
  if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

// Helper to strictly clean any photo/image claims if no media is attached
function cleanImageClaimsIfNoMedia(msg: string): string {
  return msg
    .replace(/(?:সাথে\s+)?(?:সংযুক্ত|যুক্ত|দেওয়া)\s+ছবি(?:টি|তে|গুলোর)?\s+(?:একঝলক\s+)?(?:দেখতে\s+পারেন|দেখে\s+নিন|দেখে\s+নিতে\s+পারেন|দেখুন|লক্ষ্য\s+করুন)[^।!?\n]*[।!?]/gi, '')
    .replace(/(?:সংযুক্ত|যুক্ত)\s+ছবি(?:টি|তে|গুলোর)?\s*[^।!?\n]*[।!?]/gi, '')
    .replace(/ছবিতে\s+(?:একঝলক\s+)?(?:দেখে\s+নিন|দেখতে\s+পারেন|দেখুন)[^।!?\n]*[।!?]/gi, '')
    .replace(/(?:সংযুক্ত|যুক্ত)\s+ছবি(?:টি)?/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Fallback generator when Gemini API Key is missing or rate limited
function generateFallbackCampaign(
  storeName: string,
  offer: string,
  campaignGoal: string,
  customers: Array<any>,
  mediaAttachment: any = null
) {
  return customers.map((c, index) => {
    const nameParts = (c.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const isFemale =
      firstName.endsWith('া') ||
      firstName.endsWith('ী') ||
      firstName.endsWith('িন') ||
      c.name.includes('বেগম') ||
      c.name.includes('খাতুন') ||
      c.name.includes('তাসনিম') ||
      c.name.includes('চৌধুরী') ||
      c.name.includes('জাহান') ||
      c.name.includes('নুসরাত') ||
      c.name.includes('ফাতেমা') ||
      c.name.includes('আফরিন') ||
      c.name.includes('তানজিনা') ||
      c.name.includes('ফারহানা') ||
      c.name.includes('আক্তার') ||
      c.name.includes('সুলতানা') ||
      c.name.includes('সাদিয়া') ||
      c.name.includes('মারিয়াম') ||
      c.name.includes('রোকেয়া');
    const honorific = isFemale ? 'আপু' : 'ভাইয়া';
    
    let whatsapp = '';
    let sms = '';
    let timing = 'রাত ৮:০০ - ১০:০০';
    let urgency = 'Medium';
    let nextProduct = 'নতুন রিফিল প্যাক';

    if (campaignGoal === 'replenishment') {
      urgency = (c.daysAgo && c.daysAgo > 35) ? 'High' : 'Medium';
      timing = 'দুপুর ২:০০ - বিকাল ৪:০০';
      nextProduct = `${c.lastProduct} কম্বো বা রিফিল`;
      whatsapp = `আসসালামু আলাইকুম ${c.name} ${honorific}। আশা করি ভালো আছেন! 😊\n\nকিছুদিন আগে ${storeName} থেকে আপনার নেওয়া "${c.lastProduct}" কেমন উপভোগ করছেন?\n\nমনে হলো পণ্যটি হয়তো প্রায় শেষের দিকে। আপনার সুবিধার্থে আমরা আমাদের বিশেষ রিপিট অফার দিচ্ছি: "${offer}"।\n\nআপনি চাইলে এখনই রিপ্লাই দিয়ে সহজে অর্ডারটি কনফার্ম করে নিতে পারেন। ধন্যবাদ! 🌸`;
      sms = `${storeName}: আসসালামু আলাইকুম ${c.name}। আপনার "${c.lastProduct}" কি শেষ? রিস্টকে পান ${offer}। অর্ডার করতে রিপ্লাই দিন বা কল করুন: ${c.phone}`;
    } else if (campaignGoal === 'cross_sell') {
      urgency = 'Medium';
      timing = 'সন্ধ্যা ৬:০০ - রাত ৮:০০';
      nextProduct = `${c.lastProduct} এর সাথে ম্যাচিং নিউ কালেকশন`;
      whatsapp = `আসসালামু আলাইকুম ${c.name} ${honorific}! 😊\n\n${storeName}-এ আপনার নেওয়া "${c.lastProduct}" এর সাথে পারফেক্ট ম্যাচিং আমাদের সম্পূর্ণ নতুন কালেকশন লঞ্চ হয়েছে!\n\nআমাদের প্রিয় ক্রেতা হিসেবে আপনার জন্য স্পেশাল রি-অর্ডার উপহার: "${offer}"।\n\nনতুন ডিজাইন ও সাইজ দেখতে এই মেসেজেই সরাসরি রিপ্লাই করতে পারেন। আনন্দময় দিন কাটুক! ✨`;
      sms = `${storeName}: প্রিয় ${c.name}, আপনার "${c.lastProduct}" এর সাথে পারফেক্ট ম্যাচিং নতুন কালেকশন এসেছে! স্পেশাল অফার: ${offer}। বিস্তারিত জানতে রিপ্লাই দিন।`;
    } else {
      urgency = 'Nurture';
      timing = 'সকাল ১১:০০ - দুপুর ১:০০';
      nextProduct = `প্রিমিয়াম ভিআইপি বান্ডেল`;
      whatsapp = `আসসালামু আলাইকুম ${c.name} ${honorific}। 💐\n\n${storeName}-এর প্রতি আপনার বিশ্বস্ততার জন্য আমরা গভীরভাবে কৃতজ্ঞ। আমাদের সম্মানিত নিয়মিত ক্রেতা হিসেবে আপনার জন্য সংরক্ষিত বিশেষ সারপ্রাইজ: "${offer}"।\n\nযেকোনো প্রয়োজনে বা স্পেশাল অর্ডারে সরাসরি এই নম্বরে আমাদের জানাতে পারেন। আপনার দিনটি সুন্দর হোক! ✨`;
      sms = `${storeName}: প্রিয় ${c.name}, আমাদের সাথে থাকার জন্য ধন্যবাদ! আপনার জন্য স্পেশাল ভিআইপি অফার: ${offer}। অর্ডার বা সহযোগিতায় এই মেসেজে জানান।`;
    }

    if (mediaAttachment?.publicUrl) {
      whatsapp += `\n\n📸 ছবির লিঙ্ক: ${mediaAttachment.publicUrl}`;
    }

    if (!mediaAttachment) {
      whatsapp = cleanImageClaimsIfNoMedia(whatsapp);
    }

    return {
      id: c.id || `cust_${index}`,
      customerName: c.name,
      personalized_whatsapp_msg: whatsapp,
      sms_version: sms.length > 158 ? sms.slice(0, 155) + '...' : sms,
      recommended_timing: timing,
      reorder_urgency: urgency,
      suggested_next_product: nextProduct,
      psychological_hook: 'আন্তরিক কুশলবিনিময় এবং রিপিট কাস্টমার সম্মাননা'
    };
  });
}

// Campaign Generation API
app.post('/api/generate-campaign', async (req, res) => {
  try {
    const {
      storeName = 'আমাদের শপ',
      storeCategory = 'ই-কমার্স',
      offer = '১০% স্পেশাল রিপিট ডিসকাউন্ট + ফ্রি ডেলিভারি',
      campaignGoal = 'replenishment',
      tone = 'polite_warm',
      mediaAttachment = null,
      customers = [],
    } = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: 'কমপক্ষে একজন কাস্টমারের তথ্য প্রয়োজন।' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment, using high-quality local generation fallback.');
      const fallbackResult = generateFallbackCampaign(storeName, offer, campaignGoal, customers, mediaAttachment);
      return res.json({
        success: true,
        source: 'fallback',
        campaigns: fallbackResult.map((fb, idx) => ({
          ...customers[idx],
          ...fb,
          phone: sanitizeBdPhone(customers[idx].phone),
          rawPhone: customers[idx].phone,
          mediaAttachment: mediaAttachment || null,
        })),
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const goalDescriptions: Record<string, string> = {
      replenishment: 'পণ্য শেষ হওয়ার সময়মতো রিস্টক/রি-অর্ডার আহ্বান (Consumables, skincare, organic food, daily essentials)',
      cross_sell: 'পূর্বের কেনাকাটার সাথে মানানসই নতুন কালেকশন বা কমপ্লিমেন্টারি অফার (Fashion, gadgets, lifestyle)',
      vip_appreciation: 'পুরনো বিশ্বস্ত ক্রেতাদের আন্তরিক ধন্যবাদ ও বিশেষ ভিআইপি সুবিধাদানের মাধ্যমে পুনরায় আকৃষ্ট করা'
    };

    const toneDescriptions: Record<string, string> = {
      polite_warm: 'অত্যন্ত মিষ্টি, বিনম্র, মার্জিত বাঙালি আত্মীয়তাসুলভ আলাপ (ভাইয়া / আপু সম্বোধন, শুভকামনা)',
      premium_vip: 'অভিজাত, এক্সক্লুসিভ ও মর্যাদাপূর্ণ ব্র্যান্ড টোন (সম্মানিত ক্রেতা, অগ্রাধিকারমূলক সেবা)',
      casual_friendly: 'সহজ, আন্তরিক ও প্রানবন্ত ঘরোয়া কথা'
    };

    const prompt = `
You are the top retention marketing expert for Bangladeshi e-commerce and F-Commerce businesses (Facebook Page stores, Daraz sellers, Shopify BD, WooCommerce BD).
Your task is to write high-converting, hyper-personalized win-back and repeat-order messages in natural, fluent, warm Bangla for each customer in the list below.

Store Details:
- Store Name: "${storeName}"
- Store Category: "${storeCategory}"
- Special Incentive / Offer: "${offer}"
- Campaign Objective: "${goalDescriptions[campaignGoal] || campaignGoal}"
- Desired Tone: "${toneDescriptions[tone] || tone}"
${mediaAttachment ? `- Media Attachment Included: YES (${mediaAttachment.type === 'video' ? 'ভিডিও ক্লিপ' : 'পণ্যের ছবি'}: "${mediaAttachment.name}")${mediaAttachment.publicUrl ? `, View Link: ${mediaAttachment.publicUrl}` : ''}
  * Note: You may warmly invite customer to check the attached photo/video or link for details.` : `- Media Attachment: NONE (NO photo or video is attached).
  * CRITICAL ACCURACY RULE: Absolutely NEVER write or claim "যুক্ত ছবিতে দেখুন", "সংযুক্ত ছবিতে দেখুন", "ছবিতে দেখুন", or mention attached photos/videos because NO image is attached!`}

Key Guidelines for Bangladeshi Customers:
1. **WhatsApp Message ("personalized_whatsapp_msg")**:
   - Start with "আসসালামু আলাইকুম [নাম] ভাইয়া/আপু" (use culturally accurate honorific: ভাইয়া or আপু based on Bangladeshi first/last names).
   - Warmly ask how their previous purchase ("lastProduct") was or if they are enjoying it.
   - Mention the replenishment timing or new complementary arrival naturally, NOT like an aggressive spam ad.
   - Clearly state the exclusive repeat offer: "${offer}".
   - Add a frictionless, polite call-to-action: "অর্ডার করতে বা সাইজ/কালার দেখতে এই মেসেজেই রিপ্লাই করতে পারেন।"
   - Keep emojis tasteful (😊, 🌸, 🌿, ✨). Maximum 3-4 emojis. Do not over-spam.
   - ${!mediaAttachment ? 'Do NOT mention attached photos/pictures anywhere in the message.' : 'You may reference the attached media naturally.'}

2. **Bulk SMS Message ("sms_version")**:
   - Must be compact, concise, and UNDER 160 characters (Bangladeshi telecom SMS portal standard, e.g., BulkSMSBD, Greenweb).
   - Clear hook: Store name, customer name, reminder of product, offer "${offer}", and a call to reply or link/number.
   - Count characters carefully!

3. **Recommended Timing ("recommended_timing")**:
   - Provide the best sending time window in Bangla for Bangladesh audience (e.g., "দুপুর ২:০০ - বিকাল ৪:০০", "রাত ৮:০০ - ১০:০০", "সকাল ১১:০০ - দুপুর ১:০০").

4. **Reorder Urgency ("reorder_urgency")**:
   - "High", "Medium", or "Nurture" based on purchase date/daysAgo and product nature.

5. **Suggested Next Product ("suggested_next_product")**:
   - A realistic matching complementary or refill product for this customer in Bangladesh.

6. **Psychological Hook ("psychological_hook")**:
   - 1 short sentence in Bangla explaining why this message triggers a repeat sale.

Customer List to Process:
${JSON.stringify(
  customers.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: sanitizeBdPhone(c.phone),
    lastProduct: c.lastProduct,
    purchaseDate: c.purchaseDate,
    daysAgo: c.daysAgo,
    orderValue: c.orderValue,
  })),
  null,
  2
)}

Return a strict JSON array matching the schema.
`;

    let response: any = null;
    const usedModel = 'gemini-3.8-flash';

    const modelConfig = {
      systemInstruction: 'You are an elite Bangladeshi e-commerce retention specialist fluent in contemporary business Bangla.',
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            customerName: { type: Type.STRING },
            personalized_whatsapp_msg: {
              type: Type.STRING,
              description: 'Polite, persuasive Bangla WhatsApp message',
            },
            sms_version: {
              type: Type.STRING,
              description: 'Compact SMS under 160 characters in clean Bangla',
            },
            recommended_timing: {
              type: Type.STRING,
              description: 'Optimal BD sending window e.g. রাত ৮:০০ - ১০:০০',
            },
            reorder_urgency: {
              type: Type.STRING,
              description: 'High, Medium, or Nurture',
            },
            suggested_next_product: {
              type: Type.STRING,
              description: 'Complementary or refill product recommendation',
            },
            psychological_hook: {
              type: Type.STRING,
              description: 'Short Bangla explanation of the conversion psychology',
            },
          },
          required: [
            'id',
            'customerName',
            'personalized_whatsapp_msg',
            'sms_version',
            'recommended_timing',
            'reorder_urgency',
            'suggested_next_product',
            'psychological_hook',
          ],
        },
      },
    };

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: modelConfig,
      });
    } catch (modelErr: any) {
      throw modelErr;
    }

    const textOutput = response.text?.trim() || '[]';
    let parsedCampaigns = [];

    try {
      parsedCampaigns = JSON.parse(textOutput);
    } catch (parseError) {
      console.warn('Failed to parse Gemini JSON output, using structured fallback:', textOutput);
      parsedCampaigns = generateFallbackCampaign(storeName, offer, campaignGoal, customers, mediaAttachment);
    }

    // Merge in customer original data (phone, lastProduct, daysAgo)
    const enrichedResults = customers.map((c: any) => {
      const generated = parsedCampaigns.find((p: any) => p.id === c.id) || parsedCampaigns.find((p: any) => p.customerName === c.name) || {};
      let waMsg = generated.personalized_whatsapp_msg || `আসসালামু আলাইকুম ${c.name}! ${storeName}-এর পক্ষ থেকে আপনার জন্য স্পেশাল অফার: ${offer}`;
      
      // If mediaAttachment has publicUrl and it's not already in the message, append it cleanly
      if (mediaAttachment?.publicUrl && !waMsg.includes(mediaAttachment.publicUrl)) {
        waMsg += `\n\n📸 ছবির লিঙ্ক: ${mediaAttachment.publicUrl}`;
      }

      // If NO media is attached, ensure message never mistakenly claims "যুক্ত ছবিতে দেখুন"
      if (!mediaAttachment) {
        waMsg = cleanImageClaimsIfNoMedia(waMsg);
      }

      return {
        id: c.id,
        name: c.name,
        phone: sanitizeBdPhone(c.phone),
        rawPhone: c.phone,
        lastProduct: c.lastProduct,
        purchaseDate: c.purchaseDate,
        daysAgo: c.daysAgo,
        orderValue: c.orderValue || 1200,
        personalized_whatsapp_msg: waMsg,
        sms_version: generated.sms_version || `${storeName}: প্রিয় ${c.name}, আপনার জন্য বিশেষ অফার: ${offer}। অর্ডার করতে রিপ্লাই দিন।`,
        recommended_timing: generated.recommended_timing || 'রাত ৮:০০ - ১০:০০',
        reorder_urgency: generated.reorder_urgency || 'Medium',
        suggested_next_product: generated.suggested_next_product || 'নতুন কালেকশন',
        psychological_hook: generated.psychological_hook || 'রিপিট কাস্টমার বিশেষ ডিসকাউন্ট',
        mediaAttachment: mediaAttachment || null,
      };
    });

    return res.json({
      success: true,
      source: usedModel,
      campaigns: enrichedResults,
    });
  } catch (error: any) {
    const isQuota =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('quota');

    if (isQuota) {
      console.warn('Gemini quota reached. Generated campaign messages using smart local retention engine.');
    } else {
      console.warn('Notice: Generated campaign messages using smart local retention engine.');
    }

    // In case of any API error, generate fallback so the user always has a responsive app
    const {
      storeName = 'আমাদের শপ',
      offer = '১০% স্পেশাল ডিসকাউন্ট',
      campaignGoal = 'replenishment',
      customers = [],
      mediaAttachment = null,
    } = req.body || {};
    const fallbackResults = generateFallbackCampaign(storeName, offer, campaignGoal, customers, mediaAttachment);
    
    return res.json({
      success: true,
      source: 'fallback',
      warning: 'Gemini কোটা লিমিটের কারণে স্মার্ট ব্যাকআপ টেমপ্লেট থেকে সফলভাবে বার্তা প্রস্তুত করা হয়েছে।',
      campaigns: customers.map((c: any, index: number) => {
        const fb = fallbackResults[index];
        return {
          ...c,
          phone: sanitizeBdPhone(c.phone),
          rawPhone: c.phone,
          ...fb,
          mediaAttachment: mediaAttachment || null,
        };
      }),
    });
  }
});

// Setup Vite or static serving
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
