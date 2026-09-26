import { Customer, GeneratedCampaign } from '../types';
import * as XLSX from 'xlsx';

export function sanitizeBdPhone(phone: string | number | undefined | null): string {
  if (!phone) return '01700000000';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
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

export function formatBdPhoneForWhatsApp(phone: string): string {
  const cleaned = sanitizeBdPhone(phone);
  if (cleaned.startsWith('0')) {
    return '88' + cleaned;
  }
  return '880' + cleaned;
}

/**
 * Scan row object keys or row array to identify standard Bangladeshi header columns:
 * - Name: 'Name', 'Customer Name', 'কাস্টমার', 'নাম', 'গ্রাহক'
 * - Phone: 'Phone', 'Mobile', 'Contact', 'ফোন', 'মোবাইল', 'নাম্বার', 'নম্বর', 'mobile number'
 * - Product: 'Product', 'Item', 'পণ্য', 'Order Item', 'আইটেম', 'last product'
 * - Date: 'Date', 'Order Date', 'তারিখ', 'days', 'দিন'
 * - Value: 'Price', 'Amount', 'Value', 'মূল্য', 'টাকা', 'Total'
 */
function findMatchingKey(keys: string[], patterns: string[]): string | undefined {
  return keys.find((key) => {
    const lower = key.trim().toLowerCase();
    return patterns.some((p) => lower.includes(p.toLowerCase()));
  });
}

export function parseExcelFile(data: ArrayBuffer | Uint8Array): Customer[] {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as array of objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  if (rawRows.length === 0) return [];

  const sampleRow = rawRows[0];
  const keys = Object.keys(sampleRow);

  const nameKey = findMatchingKey(keys, ['customer name', 'name', 'কাস্টমার', 'নাম', 'গ্রাহক', 'buyer']);
  const phoneKey = findMatchingKey(keys, ['phone', 'mobile', 'contact', 'ফোন', 'মোবাইল', 'নাম্বার', 'নম্বর', 'cell']);
  const prodKey = findMatchingKey(keys, ['product', 'item', 'order item', 'পণ্য', 'আইটেম', 'last product', 'details']);
  const dateKey = findMatchingKey(keys, ['order date', 'purchase date', 'date', 'তারিখ', 'days', 'দিন', 'time']);
  const valueKey = findMatchingKey(keys, ['price', 'amount', 'total', 'value', 'মূল্য', 'টাকা', 'বিল']);

  const customers: Customer[] = [];
  const today = new Date();

  rawRows.forEach((row, index) => {
    const rawName = nameKey ? row[nameKey] : Object.values(row)[0];
    const rawPhone = phoneKey ? row[phoneKey] : Object.values(row)[1];
    const rawProd = prodKey ? row[prodKey] : Object.values(row)[2];
    const rawDate = dateKey ? row[dateKey] : Object.values(row)[3];
    const rawValue = valueKey ? row[valueKey] : Object.values(row)[4];

    if (!rawName && !rawPhone) return;

    const name = String(rawName || `ক্রেতা ${index + 1}`).trim();
    const phone = sanitizeBdPhone(rawPhone);
    const lastProduct = String(rawProd || 'পূর্বে অর্ডারকৃত পণ্য').trim();

    let daysAgo = 30;
    let purchaseDateStr = '';

    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      purchaseDateStr = rawDate.toISOString().split('T')[0];
      const diffMs = today.getTime() - rawDate.getTime();
      daysAgo = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      const dateStr = String(rawDate || '30').trim();
      if (/^\d+$/.test(dateStr)) {
        daysAgo = parseInt(dateStr, 10);
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        purchaseDateStr = d.toISOString().split('T')[0];
      } else {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          purchaseDateStr = parsedDate.toISOString().split('T')[0];
          const diffMs = today.getTime() - parsedDate.getTime();
          daysAgo = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        } else {
          purchaseDateStr = '2026-08-15';
          daysAgo = 40;
        }
      }
    }

    const orderValue = rawValue
      ? parseFloat(String(rawValue).replace(/[^0-9.]/g, '')) || 1200
      : 1200;

    customers.push({
      id: `cust_xl_${index}_${Date.now()}`,
      name,
      phone,
      lastProduct,
      purchaseDate: purchaseDateStr,
      daysAgo,
      orderValue,
    });
  });

  return customers;
}

export function parseCsvContent(content: string): Customer[] {
  // Try XLSX read first as it handles UTF-8 Bengali characters, quotes, commas perfectly
  try {
    const workbook = XLSX.read(content, { type: 'string' });
    const firstSheet = workbook.SheetNames[0];
    if (firstSheet) {
      const worksheet = workbook.Sheets[firstSheet];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      if (rawRows.length > 0) {
        const keys = Object.keys(rawRows[0]);
        const nameKey = findMatchingKey(keys, ['customer name', 'name', 'কাস্টমার', 'নাম', 'গ্রাহক', 'buyer']);
        const phoneKey = findMatchingKey(keys, ['phone', 'mobile', 'contact', 'ফোন', 'মোবাইল', 'নাম্বার', 'নম্বর', 'cell']);
        const prodKey = findMatchingKey(keys, ['product', 'item', 'order item', 'পণ্য', 'আইটেম', 'last product']);
        const dateKey = findMatchingKey(keys, ['order date', 'purchase date', 'date', 'তারিখ', 'days', 'দিন']);
        const valueKey = findMatchingKey(keys, ['price', 'amount', 'total', 'value', 'মূল্য', 'টাকা']);

        const today = new Date();
        return rawRows.map((row, index) => {
          const rawName = nameKey ? row[nameKey] : Object.values(row)[0];
          const rawPhone = phoneKey ? row[phoneKey] : Object.values(row)[1];
          const rawProd = prodKey ? row[prodKey] : Object.values(row)[2];
          const rawDate = dateKey ? row[dateKey] : Object.values(row)[3];
          const rawVal = valueKey ? row[valueKey] : Object.values(row)[4];

          const name = String(rawName || `ক্রেতা ${index + 1}`).trim();
          const phone = sanitizeBdPhone(rawPhone);
          const lastProduct = String(rawProd || 'পূর্বে অর্ডারকৃত পণ্য').trim();

          let daysAgo = 30;
          let purchaseDateStr = '';
          const dateStr = String(rawDate || '30').trim();

          if (/^\d+$/.test(dateStr)) {
            daysAgo = parseInt(dateStr, 10);
            const d = new Date();
            d.setDate(d.getDate() - daysAgo);
            purchaseDateStr = d.toISOString().split('T')[0];
          } else {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              purchaseDateStr = parsedDate.toISOString().split('T')[0];
              const diffMs = today.getTime() - parsedDate.getTime();
              daysAgo = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            } else {
              purchaseDateStr = '2026-08-15';
              daysAgo = 40;
            }
          }

          const orderValue = rawVal ? parseFloat(String(rawVal).replace(/[^0-9.]/g, '')) || 1200 : 1200;

          return {
            id: `cust_csv_${index}_${Date.now()}`,
            name,
            phone,
            lastProduct,
            purchaseDate: purchaseDateStr,
            daysAgo,
            orderValue,
          };
        });
      }
    }
  } catch (e) {
    console.warn('XLSX csv parse fallback to manual string parse:', e);
  }

  // Fallback manual CSV parse
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const headerCols = lines[0].split(delimiter).map((c) => c.trim().toLowerCase().replace(/['"]/g, ''));
  
  let nameIdx = headerCols.findIndex((c) => c.includes('name') || c.includes('নাম'));
  let phoneIdx = headerCols.findIndex((c) => c.includes('phone') || c.includes('mobile') || c.includes('ফোন') || c.includes('মোবাইল') || c.includes('number'));
  let prodIdx = headerCols.findIndex((c) => c.includes('product') || c.includes('item') || c.includes('পণ্য') || c.includes('last'));
  let dateIdx = headerCols.findIndex((c) => c.includes('date') || c.includes('তারিখ') || c.includes('days') || c.includes('দিন'));
  let valueIdx = headerCols.findIndex((c) => c.includes('price') || c.includes('amount') || c.includes('value') || c.includes('টাকা') || c.includes('মূল্য'));

  const startIndex = (nameIdx >= 0 || phoneIdx >= 0) ? 1 : 0;
  if (nameIdx === -1) nameIdx = 0;
  if (phoneIdx === -1) phoneIdx = 1;
  if (prodIdx === -1) prodIdx = 2;
  if (dateIdx === -1) dateIdx = 3;

  const results: Customer[] = [];
  const today = new Date();

  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i];
    const cols = row.split(delimiter).map((col) => col.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    const name = cols[nameIdx] || `Customer ${i}`;
    const rawPhone = cols[phoneIdx] || '';
    const phone = sanitizeBdPhone(rawPhone);
    const lastProduct = cols[prodIdx] || 'পূর্বের অর্ডারকৃত পণ্য';
    const dateOrDays = cols[dateIdx] || '30';
    const value = valueIdx >= 0 && cols[valueIdx] ? parseFloat(cols[valueIdx].replace(/[^0-9.]/g, '')) || 1200 : 1200;

    let daysAgo = 30;
    let purchaseDateStr = '';

    if (/^\d+$/.test(dateOrDays)) {
      daysAgo = parseInt(dateOrDays, 10);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      purchaseDateStr = d.toISOString().split('T')[0];
    } else {
      const parsedDate = new Date(dateOrDays);
      if (!isNaN(parsedDate.getTime())) {
        purchaseDateStr = parsedDate.toISOString().split('T')[0];
        const diffMs = today.getTime() - parsedDate.getTime();
        daysAgo = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      } else {
        purchaseDateStr = '2026-08-15';
        daysAgo = 40;
      }
    }

    results.push({
      id: `cust_up_${i}_${Date.now()}`,
      name,
      phone,
      lastProduct,
      purchaseDate: purchaseDateStr,
      daysAgo,
      orderValue: value,
    });
  }

  return results;
}

export function exportBulkSmsCsv(campaigns: GeneratedCampaign[], filename = 'BD_BulkSMS_Campaign.csv') {
  const headers = ['Mobile Number', 'Message', 'Customer Name'];
  const rows = campaigns.map((c) => [
    `"${c.phone}"`,
    `"${c.sms_version.replace(/"/g, '""')}"`,
    `"${c.name.replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  triggerDownload(csvContent, filename);
}

export function exportFullReportCsv(campaigns: GeneratedCampaign[], filename = 'RepeatCustomerBD_Report.csv') {
  const headers = [
    'Customer Name',
    'Mobile Number',
    'Previous Product',
    'Days Since Purchase',
    'Order Value (BDT)',
    'Urgency Level',
    'Recommended Sending Time',
    'Suggested Complementary Product',
    'Personalized WhatsApp Message',
    'Bulk SMS Version',
  ];

  const rows = campaigns.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.phone}"`,
    `"${c.lastProduct.replace(/"/g, '""')}"`,
    c.daysAgo,
    c.orderValue,
    `"${c.reorder_urgency}"`,
    `"${c.recommended_timing}"`,
    `"${c.suggested_next_product.replace(/"/g, '""')}"`,
    `"${c.personalized_whatsapp_msg.replace(/"/g, '""')}"`,
    `"${c.sms_version.replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  triggerDownload(csvContent, filename);
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

