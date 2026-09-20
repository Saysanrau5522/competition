const fs = require('fs');
const { google } = require('googleapis');
const creds = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
const auth = new google.auth.JWT(creds.client_email, null, creds.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
const sheets = google.sheets({ version: 'v4', auth });

async function backfill() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1fcWlDa-5X3bSU6mPsw475yFnzjx2SgNPTs1fURfYa7k',
    range: 'A1:R13'
  });

  const rows = res.data.values;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[16] || r[16].trim() === '') {
      const company = r[2] || 'SME';
      const contact = r[3] || 'Owner';
      const bottleneck = r[11] || 'manual operational bottlenecks';
      const pkg = r[12] || 'Exabytes Cloud Suite';
      const roi = r[13] || 'RM 15,000';

      const script = [
        `1) Hook: Acknowledge context: "Hi ${contact}, I reviewed your diagnostic for ${company}. Noticed your team dedicates significant weekly hours battling ${bottleneck}."`,
        `2) Prescription: Phase 1 Quick Win: "Deploying ${pkg} automates immediate workflow friction in under 7 business days."`,
        `3) Math: Close with hard numbers: "Reclaiming wasted hours yields an estimated ${roi} in recovered administrative capacity annually, paying for itself in weeks."`
      ].join('\n\n');

      const rowNum = i + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: '1fcWlDa-5X3bSU6mPsw475yFnzjx2SgNPTs1fURfYa7k',
        range: `Q${rowNum}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[script]] }
      });
      console.log(`Backfilled Row ${rowNum} (${company})`);
    }
  }
  console.log('✅ Backfill complete! All rows now have AI Closing Scripts in Column Q.');
}

backfill().catch(console.error);
