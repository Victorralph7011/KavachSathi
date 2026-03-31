import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Enterprise PDF Generator
 * Renders a hidden "Dark Ops" certificate node into a high-res PDF.
 */
export async function downloadPolicyCertificate(policy) {
  if (!policy) return;

  // 1. Create a pristine, off-screen DOM element for the certificate styling
  const certNode = document.createElement('div');
  certNode.innerHTML = `
    <div style="width: 800px; padding: 60px; background: #0A0A0A; color: #FFFFFF; font-family: monospace; border: 4px solid #39FF14; box-sizing: border-box;">
      <div style="border-bottom: 2px solid #39FF14; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="color: #39FF14; margin: 0; font-family: serif; font-size: 32px; letter-spacing: 2px;">KAVACH_SATHI</h1>
          <p style="margin: 5px 0 0 0; color: #A0A0A0;">CERTIFICATE OF INSURANCE :: <span style="color: #39FF14;">${policy.status || 'ISSUED'}</span></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #39FF14; font-size: 20px;">${policy.policyId}</p>
          <p style="margin: 5px 0 0 0; color: #A0A0A0;">DATE: ${new Date(policy.issuedAt || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #FFFFFF; border-bottom: 1px dashed #333; padding-bottom: 10px;">// ENTITY_DETAILS</h3>
        <table style="width: 100%; text-align: left; border-spacing: 0;">
          <tr>
            <td style="padding: 10px 0; color: #A0A0A0; width: 30%;">INSURED_NAME</td>
            <td style="padding: 10px 0; color: #39FF14; font-size: 18px;">${policy.insuredName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #A0A0A0;">WORKER_NODE_ID</td>
            <td style="padding: 10px 0;">${policy.workerId || 'UNKNOWN'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #A0A0A0;">AADHAAR_HASH (MASKED)</td>
            <td style="padding: 10px 0;">${policy.aadhaarMasked || 'XXXX-XXXX-XXXX'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #A0A0A0;">OPERATING_PLATFORM</td>
            <td style="padding: 10px 0;">${policy.platform?.toUpperCase()}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 40px; padding: 20px; background: rgba(57,255,20,0.05); border: 1px solid #39FF14;">
        <h3 style="color: #39FF14; margin-top: 0;">// RISK_COMPUTATION_MATRIX</h3>
        <table style="width: 100%; text-align: left; border-spacing: 0;">
          <tr>
            <td style="padding: 8px 0; color: #A0A0A0; width: 50%;">ASSIGNED_RISK_GRADE</td>
            <td style="padding: 8px 0; font-size: 20px; font-weight: bold; color: ${policy.riskGrade === 'A' ? '#39FF14' : '#FFB000'};">${policy.riskGrade || 'A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #A0A0A0;">BASE_STATE_VECTOR</td>
            <td style="padding: 8px 0;">${policy.baseState?.name || 'GLOBAL'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #A0A0A0;">SECURED_PREMIUM</td>
            <td style="padding: 8px 0;">₹${policy.paymentAmount || policy.estimatedPremium} / ${policy.termType}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 60px; border-top: 2px solid #333; padding-top: 20px; text-align: center;">
        <p style="color: #555; font-size: 12px; margin-bottom: 10px;">CRYPTOGRAPHIC_SIGNATURE_SEAL</p>
        <div style="display: inline-block; padding: 10px 20px; border: 1px solid #333; color: #39FF14; background: #000;">
          <span style="font-size: 10px;">HASH::${policy.policyId}-${policy.updatedAt?.seconds || Date.now()}-VRFD</span>
        </div>
        <p style="color: #555; font-size: 10px; margin-top: 15px;">Digitally verifiable. Valid across decentralized execution layers. IRDAI Sandbox Reg: #SBOX-2026</p>
      </div>
    </div>
  `;

  // Temporarily attach to DOM (hidden) to render canvas
  document.body.appendChild(certNode);
  certNode.style.position = 'absolute';
  certNode.style.left = '-9999px';
  certNode.style.top = '-9999px';

  try {
    const canvas = await html2canvas(certNode.firstElementChild, {
      scale: 2,
      backgroundColor: '#0A0A0A',
    });

    const imgData = canvas.toDataURL('image/png');
    // A4 dimensions: 210x297 mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Calculate dimensions to fit A4 width
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`KavachSathi_Policy_${policy.policyId}.pdf`);

  } catch (err) {
    console.error('[KAVACH] PDF Generation Failed:', err);
  } finally {
    // Cleanup
    document.body.removeChild(certNode);
  }
}
