import React from 'react';
import { TrendingUp, DollarSign, Clock, ShieldCheck } from 'lucide-react';

export const RoiBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Meta Ads বিহীন রিটেনশন বিপ্লব</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="text-slate-300">Gemini 3.8 Flash ইনটেলিজেন্স</span>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance leading-snug">
          ফেসবুক বিজ্ঞাপনে বাড়তি টাকা নষ্ট না করে, পূর্বের ক্রেতাদের থেকে নিন নিশ্চিত রি-অর্ডার
        </h1>

        <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
          বাংলাদেশে নতুন কাস্টমার জোগাড়ে গড়ে ৳২৫০-৳৪০০ অ্যাড খরচ হয়। অথচ আপনার পুরনো সন্তুষ্ট ক্রেতারা সময়মতো বিনীত বার্তা পেলে সহজেই পুনরায় অর্ডার করেন। 
          আমরা প্রতিটি পণ্যের ব্যবহারের মেয়াদ মিলিয়ে খাঁটি বাংলায় অতি-ব্যক্তিগতকৃত হোয়াটসঅ্যাপ ও বাল্ক এসএমএস বার্তা তৈরি করে দিই।
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">অ্যাড খরচ সেভ</div>
            <div className="text-base font-bold text-white tabular-nums">৳২৫০+ / কাস্টমার</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">রি-অর্ডার কনভার্সন</div>
            <div className="text-base font-bold text-white tabular-nums">২৮% - ৪২%</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">স্মার্ট টাইমিং</div>
            <div className="text-base font-bold text-white">স্বয়ংক্রিয় রিফিল ক্যালকুলেশন</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">১-ট্যাপ ডেলিভারি</div>
            <div className="text-base font-bold text-white">WhatsApp & টেলিকম SMS</div>
          </div>
        </div>
      </div>
    </div>
  );
};
