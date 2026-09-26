import React from 'react';
import { GeneratedCampaign } from '../types';
import { Users, DollarSign, TrendingUp, MessageSquare } from 'lucide-react';

interface MetricsCardsProps {
  campaigns: GeneratedCampaign[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ campaigns }) => {
  const totalCustomers = campaigns.length;
  // Estimated ad spend saved @ ৳250 per acquisition in BD ecommerce
  const adSpendSaved = totalCustomers * 250;
  // Average order value in current cohort
  const totalValue = campaigns.reduce((acc, c) => acc + (c.orderValue || 1200), 0);
  const avgOrderValue = totalCustomers > 0 ? Math.round(totalValue / totalCustomers) : 1200;
  // Assuming a conservative 35% repeat order conversion rate via polite WhatsApp/SMS
  const projectedRepeatRevenue = Math.round(totalCustomers * 0.35 * avgOrderValue);

  // Average SMS length
  const totalChars = campaigns.reduce((acc, c) => acc + c.sms_version.length, 0);
  const avgSmsLength = totalCustomers > 0 ? Math.round(totalChars / totalCustomers) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">টার্গেটেড ক্রেতা</span>
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {totalCustomers} <span className="text-xs font-sans font-medium text-slate-500">জন</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          সরাসরি পূর্বের কাস্টমার ডাটাবেজ
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">অ্যাড খরচ সেভ</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
          ৳{adSpendSaved.toLocaleString('en-US')}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          মেটা বিজ্ঞাপনের ৳২৫০/কাস্টমার সাশ্রয়
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">সম্ভাব্য রি-অর্ডার আয়</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          ৳{projectedRepeatRevenue.toLocaleString('en-US')}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          ৩৫% রি-অর্ডার কনভার্সন হিসেবে
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">গড় SMS ক্যারেক্টার</span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {avgSmsLength} <span className="text-xs font-sans font-medium text-slate-500">/ ১৬০</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          ১টি SMS স্লটে টেলিকম গেটওয়ে উপযুক্ত
        </div>
      </div>
    </div>
  );
};
