/**
 * Constructs an official HTML email document for tour proposals.
 */
export function buildProposalEmailHtml(params: {
  proposal: any;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  senderName?: string;
  senderEmail?: string;
  proposalUrl?: string;
}) {
  const p = params.proposal || {};
  const cName = params.companyName || params.senderName || 'Smart Bali Tours & Travel';
  const cEmail = params.companyEmail || params.senderEmail || 'info@smartbalitours.com';
  const cPhone = params.companyPhone || '+62 812-3456-7890';
  const cWeb = params.companyWebsite || 'www.smartbalitours.com';
  const proposalUrl = params.proposalUrl || p.proposalUrl || '';

  // Construct Day-by-Day HTML
  let itineraryHtml = '';
  if (Array.isArray(p.itineraryNarrative)) {
    p.itineraryNarrative.forEach((day: any) => {
      itineraryHtml += `
        <div style="margin-bottom: 16px; padding: 14px 18px; background-color: #f8fafc; border-left: 4px solid #f97316; border-radius: 8px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 14px;">
            <span style="background-color: #ea580c; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 900; margin-right: 8px;">DAY ${day.dayNumber}</span>
            ${day.title || `Day ${day.dayNumber}`}
          </div>
          <p style="margin: 6px 0 0 0; color: #475569; font-size: 13px; line-height: 1.5;">${day.summary || ''}</p>
        </div>
      `;
    });
  }

  // Construct Inclusions HTML
  let inclusionsHtml = '';
  if (Array.isArray(p.inclusions) && p.inclusions.length > 0) {
    inclusionsHtml = p.inclusions.map((inc: string) => `<li style="margin-bottom: 4px; color: #166534; font-size: 13px;">✓ ${inc}</li>`).join('');
  }

  // Construct Exclusions HTML
  let exclusionsHtml = '';
  if (Array.isArray(p.exclusions) && p.exclusions.length > 0) {
    exclusionsHtml = p.exclusions.map((exc: string) => `<li style="margin-bottom: 4px; color: #9f1239; font-size: 13px;">✕ ${exc}</li>`).join('');
  }

  // Construct Terms HTML
  let termsHtml = '';
  if (Array.isArray(p.termsAndConditions) && p.termsAndConditions.length > 0) {
    termsHtml = p.termsAndConditions.map((term: string, idx: number) => `<li style="margin-bottom: 4px; color: #475569; font-size: 12px;">${idx + 1}. ${term}</li>`).join('');
  }

  const emailSubject = `Official Tour Proposal: ${p.proposalTitle || 'Your Bali Itinerary'} - ${cName}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${emailSubject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px 28px; color: #ffffff;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #ffedd5; margin-bottom: 6px;">OFFICIAL TOUR PROPOSAL</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; line-height: 1.3;">${p.proposalTitle || 'Custom Tour Proposal'}</h1>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #ffedd5;">Prepared for <strong>${p.guestName || 'Valued Guest'}</strong></p>
        </div>

        <div style="padding: 28px;">
          <!-- Welcome Note -->
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0; background-color: #fff7ed; padding: 16px; border-radius: 12px; border-left: 4px solid #f97316;">
            ${p.welcomeMessage || `Dear ${p.guestName}, thank you for choosing us! We are thrilled to present your personalized itinerary.`}
          </p>

          <!-- Trip Overview Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 12px; font-size: 13px;">
            <tr>
              <td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Guest Name:</td>
              <td style="padding: 10px 14px; color: #0f172a; font-weight: bold;">${p.guestName || 'N/A'}</td>
              <td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Pax Count:</td>
              <td style="padding: 10px 14px; color: #0f172a; font-weight: bold;">${p.paxCount || 1} Person(s)</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Duration:</td>
              <td style="padding: 10px 14px; color: #0f172a; font-weight: bold;">${p.durationDays || 1} Day(s)</td>
              <td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Nationality:</td>
              <td style="padding: 10px 14px; color: #0f172a; font-weight: bold;">${p.nationality || 'International'}</td>
            </tr>
          </table>

          <!-- Detailed Itinerary -->
          <h3 style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 28px;">
            🗺️ Day-by-Day Itinerary & Logistics
          </h3>
          ${itineraryHtml}

          <!-- Inclusions & Exclusions Grid -->
          <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin-top: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px;">
                <div style="font-size: 12px; font-weight: 900; color: #166534; text-transform: uppercase; margin-bottom: 8px;">✅ Inclusions</div>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${inclusionsHtml || '<li style="font-size: 12px; color: #64748b; italic;">Specified in package</li>'}
                </ul>
              </td>
              <td style="width: 50%; vertical-align: top; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px;">
                <div style="font-size: 12px; font-weight: 900; color: #9f1239; text-transform: uppercase; margin-bottom: 8px;">✕ Exclusions</div>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${exclusionsHtml || '<li style="font-size: 12px; color: #64748b; italic;">Personal expenses</li>'}
                </ul>
              </td>
            </tr>
          </table>

          <!-- Price Box -->
          <div style="margin-top: 24px; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #f97316; letter-spacing: 1px;">Total Package Investment</div>
            <div style="font-size: 28px; font-weight: 900; margin-top: 4px; color: #ffffff;">${p.currency || 'IDR'} ${Number(p.totalPrice || 0).toLocaleString()}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">All taxes, vehicle charters, tickets & guide fees included</div>
          </div>

          <!-- Interactive Proposal Web Link Callout -->
          ${proposalUrl ? `
            <div style="margin-top: 28px; text-align: center; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px solid #ea580c; padding: 24px 20px; border-radius: 16px; box-shadow: 0 4px 14px rgba(234,88,12,0.15);">
              <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #c2410c; margin-bottom: 6px;">
                🌐 ONLINE INTERACTIVE PROPOSAL & ITINERARY
              </div>
              <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 900; color: #7c2d12;">
                View Your Professional Interactive Proposal
              </h3>
              <p style="font-size: 13px; color: #9a3412; margin: 0 0 16px 0; line-height: 1.5; font-weight: 500;">
                Click below to view your interactive day-by-day itinerary, inclusions, package terms, and accept your proposal directly online.
              </p>
              <a href="${proposalUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; font-weight: 900; font-size: 14px; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 6px 18px rgba(234, 88, 12, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                Open Interactive Web Proposal &rarr;
              </a>
              <div style="margin-top: 14px; font-size: 11px; color: #9a3412; word-break: break-all;">
                Direct link: <a href="${proposalUrl}" target="_blank" style="color: #ea580c; font-weight: bold; text-decoration: underline;">${proposalUrl}</a>
              </div>
            </div>
          ` : ''}

          <!-- Terms & Conditions -->
          ${termsHtml ? `
            <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px;">Booking Terms & Conditions</div>
              <ul style="margin: 0; padding-left: 0; list-style: none;">
                ${termsHtml}
              </ul>
            </div>
          ` : ''}

          <!-- Closing Note -->
          <p style="font-size: 13px; color: #475569; text-align: center; margin-top: 28px; font-style: italic;">
            "${p.closingNotes || 'We look forward to welcoming you to Bali!'}"
          </p>

          <!-- Footer Company Branding -->
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
            <div style="font-weight: 800; color: #0f172a; font-size: 14px;">${cName}</div>
            <div style="margin-top: 4px;">📧 ${cEmail} | 📞 ${cPhone}</div>
            <div style="margin-top: 2px;">🌐 ${cWeb}</div>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  return { emailSubject, emailHtml };
}
