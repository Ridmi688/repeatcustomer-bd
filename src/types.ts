export interface MediaAttachment {
  name: string;
  type: 'image' | 'video';
  dataUrl?: string; // base64 or blob URL
  publicUrl?: string; // optional online link e.g. Facebook post image or Google Drive link
  fileSize?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  lastProduct: string;
  purchaseDate: string;
  daysAgo: number;
  orderValue: number;
}

export interface GeneratedCampaign {
  id: string;
  name: string;
  phone: string;
  rawPhone: string;
  lastProduct: string;
  purchaseDate: string;
  daysAgo: number;
  orderValue: number;
  personalized_whatsapp_msg: string;
  sms_version: string;
  recommended_timing: string;
  reorder_urgency: 'High' | 'Medium' | 'Nurture' | string;
  suggested_next_product: string;
  psychological_hook: string;
  mediaAttachment?: MediaAttachment | null;
  status?: 'pending' | 'sent' | 'skipped';
  isCustomized?: boolean;
}

export type CampaignGoal = 'replenishment' | 'cross_sell' | 'vip_appreciation';

export type CampaignTone = 'polite_warm' | 'premium_vip' | 'casual_friendly';

export interface CampaignConfig {
  storeName: string;
  storeCategory: string;
  offer: string;
  campaignGoal: CampaignGoal;
  tone: CampaignTone;
  mediaAttachment?: MediaAttachment | null;
}

