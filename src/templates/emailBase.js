/**
 * Base branded email template for IELTS Pro
 *
 * All emails sent through the email service are wrapped in this template.
 * The caller passes flexible content — no fixed templates needed.
 *
 * @param {object} options
 * @param {string} [options.previewText]  - Short preview text shown in email clients
 * @param {string} [options.title]        - Bold headline shown inside the header bar
 * @param {string}  options.body          - Main content (HTML string)
 * @param {object} [options.button]       - CTA button { text, url }
 * @param {string} [options.footerNote]   - Small note at the bottom of the footer
 * @returns {string} Full HTML email string
 */
export function buildEmailHtml({ previewText = "", title = "", body = "", button = null, footerNote = "" }) {
  const year = new Date().getFullYear();

  const previewSnippet = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`
    : "";

  const titleBlock = title
    ? `<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${title}</h1>`
    : "";

  const buttonBlock = button
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px auto 0 auto;">
        <tr>
          <td style="border-radius:8px;background:#06bbcc;">
            <a href="${button.url}" target="_blank"
               style="display:inline-block;padding:14px 32px;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background:#06bbcc;mso-padding-alt:14px 32px;">
              ${button.text}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  const footerNoteBlock = footerNote
    ? `<p style="margin:12px 0 0 0;font-size:12px;color:#98a2b3;">${footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title || "IELTS Prep & Practice"}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: #06bbcc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .email-wrapper { background-color: #f2f4f7; }
    .email-card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(16,24,40,0.08); }
    .email-header { background: linear-gradient(135deg, #06bbcc 0%, #047a85 100%); padding: 36px 40px 32px; text-align: center; }
    .email-body { padding: 40px 40px 32px; color: #101828; font-family: 'Outfit', Arial, sans-serif; font-size: 15px; line-height: 1.7; }
    .email-footer { background: #f9fafb; border-top: 1px solid #e4e7ec; padding: 24px 40px; text-align: center; }
    @media only screen and (max-width: 620px) {
      .email-card { border-radius: 0 !important; }
      .email-header { padding: 28px 24px 24px !important; }
      .email-body { padding: 28px 24px 24px !important; }
      .email-footer { padding: 20px 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f2f4f7;font-family:'Outfit',Arial,sans-serif;">

${previewSnippet}

<!-- Wrapper -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- Outer card (max 600px) -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
             style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(16,24,40,0.08);">

        <!-- ─── HEADER ─── -->
        <tr>
          <td style="background:linear-gradient(135deg,#06bbcc 0%,#047a85 100%);padding:36px 40px 32px;text-align:center;">

            <!-- Logo mark + brand name -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 16px auto;">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <!-- SVG logo mark (stylised "I" for IELTS) -->
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="36" height="36" rx="8" fill="rgba(255,255,255,0.2)"/>
                    <rect x="14" y="8" width="8" height="20" rx="4" fill="#ffffff"/>
                    <rect x="8" y="8" width="20" height="4" rx="2" fill="#ffffff"/>
                    <rect x="8" y="24" width="20" height="4" rx="2" fill="#ffffff"/>
                  </svg>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:'Outfit',Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">IELTS Prep & Practice</span>
                </td>
              </tr>
            </table>

            ${titleBlock}
          </td>
        </tr>

        <!-- ─── BODY ─── -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">
            <div style="font-family:'Outfit',Arial,sans-serif;font-size:15px;line-height:1.75;color:#101828;">
              ${body}
            </div>

            ${buttonBlock}
          </td>
        </tr>

        <!-- ─── DIVIDER ─── -->
        <tr>
          <td style="background:#ffffff;padding:0 40px;">
            <hr style="border:none;border-top:1px solid #e4e7ec;margin:0;">
          </td>
        </tr>

        <!-- ─── FOOTER ─── -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#667085;line-height:1.6;">
              &copy; ${year} <strong style="color:#344054;">IELTS Prep & Practice</strong>. All rights reserved.
            </p>
            ${footerNoteBlock}
          </td>
        </tr>

      </table>
      <!-- /Outer card -->

    </td>
  </tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;
}
