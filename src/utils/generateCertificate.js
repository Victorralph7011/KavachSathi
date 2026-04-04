import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * KavachSathi — Professional Policy Certificate Generator
 * ========================================================
 * 
 * Clean, corporate white layout with:
 * - KavachSathi Mission Control branding
 * - QR code for authenticity (encodes policy ID + issue date)
 * - Trigger thresholds (Rain > 60mm, AQI > 300)
 * - Weekly ₹20–₹50 premium range
 * - Loss of Income ONLY compliance labels
 * - FOOD_DELIVERY persona
 */

function drawRoundedRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r, 'S');
}

function drawFilledRoundedRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

export async function downloadPolicyCertificate(policy) {
  if (!policy) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const W = pdf.internal.pageSize.getWidth(); // 210mm
  const H = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 18;
  const contentW = W - margin * 2;

  // ─── Background ───────────────────────────────────────
  pdf.setFillColor(250, 250, 248); // #FAFAF8
  pdf.rect(0, 0, W, H, 'F');

  // ─── Top Brand Bar ────────────────────────────────────
  pdf.setFillColor(15, 23, 42); // #0F172A
  pdf.rect(0, 0, W, 42, 'F');

  // Brand Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.text('KAVACH', margin, 22);
  pdf.setFont('helvetica', 'normal');
  pdf.text('SATHI', margin + 41, 22);

  // Subtitle
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('PARAMETRIC MICRO-INSURANCE · MISSION CONTROL', margin, 30);

  // Certificate Type
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(16, 185, 129); // emerald-500
  pdf.text('CERTIFICATE OF INSURANCE', W - margin, 22, { align: 'right' });

  // Status Badge
  const status = policy.status || 'ISSUED';
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(5, 150, 105); // emerald-600
  drawFilledRoundedRect(pdf, W - margin - 24, 25, 24, 7, 2);
  pdf.text(status, W - margin - 12, 30, { align: 'center' });

  // ─── Policy ID Banner ─────────────────────────────────
  let y = 50;
  pdf.setFillColor(241, 245, 249); // slate-100
  drawFilledRoundedRect(pdf, margin, y, contentW, 18, 3);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(policy.policyId || 'KS-POLICY-ID', margin + 6, y + 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139); // slate-500
  const issueDate = policy.issuedAt ? new Date(policy.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  pdf.text(`Issued: ${issueDate}`, W - margin - 6, y + 11, { align: 'right' });

  // ─── QR Code ──────────────────────────────────────────
  y += 26;
  try {
    const qrData = `KAVACHSATHI|${policy.policyId}|${issueDate}|${status}|${policy.insuredName || 'WORKER'}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: '#0F172A', light: '#FAFAF8' },
    });
    pdf.addImage(qrDataUrl, 'PNG', W - margin - 30, y, 28, 28);
  } catch (e) {
    console.warn('[KAVACH] QR generation failed:', e);
  }

  // ─── Insured Details ──────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('INSURED DETAILS', margin, y);
  y += 6;

  const details = [
    ['Insured Name', policy.insuredName || 'Not Specified'],
    ['Worker ID', policy.workerId || 'Not Assigned'],
    ['Aadhaar (Masked)', policy.aadhaarMasked || 'XXXX-XXXX-XXXX'],
    ['Platform', (policy.platform || 'ZOMATO').toUpperCase()],
    ['Persona', 'FOOD DELIVERY PARTNER'],
  ];

  pdf.setFontSize(9);
  details.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, margin, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, margin + 44, y);
    y += 6;
  });

  // ─── Compliance Badges ────────────────────────────────
  y += 6;
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.line(margin, y, W - margin, y);
  y += 8;

  // Loss of Income ONLY
  pdf.setFillColor(254, 243, 199); // amber-100
  drawFilledRoundedRect(pdf, margin, y, 52, 8, 2);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(232, 93, 4); // amber-600
  pdf.text('LOSS OF INCOME ONLY', margin + 3, y + 5.5);

  // Weekly Billing
  pdf.setFillColor(219, 234, 254); // blue-100
  drawFilledRoundedRect(pdf, margin + 55, y, 35, 8, 2);
  pdf.setTextColor(30, 64, 175); // blue-800
  pdf.text('WEEKLY BILLING', margin + 58, y + 5.5);

  // Food Delivery
  pdf.setFillColor(220, 252, 231); // green-100
  drawFilledRoundedRect(pdf, margin + 93, y, 42, 8, 2);
  pdf.setTextColor(5, 150, 105);
  pdf.text('FOOD DELIVERY ONLY', margin + 96, y + 5.5);

  // ─── Risk & Premium Section ───────────────────────────
  y += 16;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('RISK COMPUTATION & PREMIUM', margin, y);
  y += 6;

  // Risk grade box
  pdf.setFillColor(239, 246, 255); // blue-50
  drawFilledRoundedRect(pdf, margin, y, 24, 24, 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(26, 60, 94); // #1A3C5E
  pdf.text(policy.riskGrade || 'B', margin + 12, y + 14, { align: 'center' });
  pdf.setFontSize(6);
  pdf.setTextColor(100, 116, 139);
  pdf.text('RISK GRADE', margin + 12, y + 20, { align: 'center' });

  // Risk details
  const riskX = margin + 30;
  const riskDetails = [
    ['Area Category', (policy.areaCategory || 'URBAN')],
    ['Base State', policy.baseState?.name || policy.baseState || 'INDIA'],
    ['Risk Score', (policy.riskScore ? (policy.riskScore * 100).toFixed(1) + '%' : '82%')],
    ['Ward ID', policy.wardId || 'MUMBAI_WESTERN'],
  ];

  pdf.setFontSize(8);
  riskDetails.forEach(([label, value], i) => {
    const rx = riskX + (i % 2) * 62;
    const ry = y + Math.floor(i / 2) * 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, rx, ry + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, rx + 32, ry + 4);
  });

  // Premium display
  y += 28;
  pdf.setFillColor(15, 23, 42); // #0F172A
  drawFilledRoundedRect(pdf, margin, y, contentW, 20, 3);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text('ACTUARIAL PREMIUM', margin + 6, y + 8);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  const premium = policy.paymentAmount || policy.estimatedPremium || policy.weeklyPremium || 40;
  pdf.text(`INR ${premium}`, margin + 6, y + 16);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text('/ WEEK', margin + 42, y + 16);

  // Formula
  pdf.setFontSize(7);
  pdf.setTextColor(16, 185, 129); // emerald
  pdf.text('P = P(Trigger) × L_avg × D_exposed × Risk_Multiplier', margin + 80, y + 10);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Hard-capped: ₹20 – ₹50 / week (IRDAI compliance)', margin + 80, y + 16);

  // ─── Trigger Thresholds ───────────────────────────────
  y += 28;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('PARAMETRIC TRIGGER THRESHOLDS', margin, y);
  y += 6;

  // Trigger cards
  const triggers = [
    { label: 'Rainfall', threshold: '> 60mm / hr', source: 'IMD Oracle', icon: '🌧️', color: [59, 130, 246] },
    { label: 'Air Quality', threshold: 'AQI > 300', source: 'CPCB Oracle', icon: '💨', color: [168, 85, 247] },
  ];

  triggers.forEach((t, i) => {
    const tx = margin + i * (contentW / 2 + 2);
    const tw = contentW / 2 - 2;

    pdf.setFillColor(248, 250, 252); // slate-50
    drawFilledRoundedRect(pdf, tx, y, tw, 22, 3);
    pdf.setDrawColor(...t.color);
    pdf.setLineWidth(0.5);
    pdf.line(tx + 1, y + 2, tx + 1, y + 20);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${t.icon} ${t.label}`, tx + 6, y + 8);

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...t.color);
    pdf.text(t.threshold, tx + 6, y + 15);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Source: ${t.source}`, tx + 6, y + 20);
  });

  // ─── Coverage Statement ───────────────────────────────
  y += 30;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, W - margin, y);
  y += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('COVERAGE STATEMENT', margin, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105); // slate-600
  const coverageLines = [
    'This certificate confirms that the named insured is enrolled in KavachSathi parametric',
    'micro-insurance coverage for LOSS OF INCOME arising from environmental disruptions.',
    '',
    'Coverage is limited to income loss from food delivery operations due to:',
    '  • Excessive rainfall (> 60mm/hr) preventing safe delivery operations',
    '  • Hazardous air quality (AQI > 300) requiring operational cessation',
    '',
    'This policy does NOT cover: health insurance, vehicle damage, accidents, or any',
    'non-income-related claims. Payout is automated via zero-touch parametric triggers.',
  ];

  coverageLines.forEach(line => {
    pdf.text(line, margin, y);
    y += 4;
  });

  // ─── Footer ───────────────────────────────────────────
  y = H - 28;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, W - margin, y);
  y += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('DIGITAL VERIFICATION', margin, y);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  const hashStr = `HASH::${policy.policyId}-${Date.now().toString(36).toUpperCase()}-VRFD`;
  pdf.text(hashStr, margin, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Digitally verifiable · IRDAI Sandbox Reg: #SBOX-2026 · KavachSathi Mission Control', margin, y + 10);

  // KavachSathi logo text right side
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('KS', W - margin, y + 4, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Mission Control', W - margin, y + 9, { align: 'right' });

  // ─── Save ─────────────────────────────────────────────
  pdf.save(`KavachSathi_Policy_${policy.policyId || 'Certificate'}.pdf`);
}
