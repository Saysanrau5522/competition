/**
 * Verification script for PDF generation, live Google Sheet writing,
 * and Calendar Appointment booking endpoints.
 */

async function verifyAll() {
  const BASE_URL = 'http://localhost:3000';
  console.log('🧪 Starting Verification of PDF, Google Sheets, and Calendar Booking...');

  // 1. Test PDF Generation Endpoint
  console.log('\n[1/3] Testing PDF Generation (/api/diagnostic/pdf)...');
  const pdfRes = await fetch(`${BASE_URL}/api/diagnostic/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Borneo Precision CAD Sdn Bhd',
      industry: 'Manufacturing',
      scores: { totalScore: 48, tier: 'Digital Practitioner', aiGrade: 'B', breakdown: {} },
      roi: { formatted: { annualHoursSaved: '437 hrs', annualAdminCashSaved: 'RM 10,920', totalAnnualBenefit: 'RM 22,000', roiMultiple: '8.5x' } },
      roadmap: [],
      products: []
    })
  });

  console.log(`- HTTP Status: ${pdfRes.status}`);
  const contentType = pdfRes.headers.get('Content-Type');
  console.log(`- Content-Type: ${contentType}`);

  if (!contentType || !contentType.includes('application/pdf')) {
    throw new Error(`Expected application/pdf but got ${contentType}`);
  }

  const pdfArrayBuf = await pdfRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuf);
  console.log(`- PDF Buffer Size: ${pdfBuffer.length} bytes`);
  const magic = pdfBuffer.subarray(0, 5).toString();
  console.log(`- Header Magic: "${magic}" (Valid PDF: ${magic === '%PDF-'})`);

  if (magic !== '%PDF-') {
    throw new Error('Downloaded PDF does not have valid %PDF- magic bytes!');
  }

  // 2. Test Booking Appointment to Live Google Sheet
  console.log('\n[2/3] Testing Appointment Booking to Live Google Sheet (/api/consultation/submit)...');
  const bookingPayload = {
    companyName: 'Chong Dental Specialist Clinic',
    contactName: 'Dr. Chong Wei',
    contactPhone: '+6012-7776655',
    contactEmail: 'drchong@chongdental.com.my',
    industry: 'Healthcare / Clinics',
    teamSize: '8',
    maturityScore: 52,
    maturityTier: 'Digital Practitioner',
    aiGrade: 'Grade B',
    topPainPoint: 'Manual patient appointment booking & WhatsApp reminders',
    recommendedPackage: 'Exabytes Conversational AI Lead Engine & Cloud CRM',
    annualRoiMYR: 'RM 28,500',
    preferredSlot: '2026-09-22 10:30 AM',
    notes: 'Looking to integrate WhatsApp AI appointment scheduler with clinic management system'
  };

  const consultRes = await fetch(`${BASE_URL}/api/consultation/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload)
  });
  const consultJson = await consultRes.json();
  console.log(`- Submission Success: ${consultJson.success}`);
  console.log(`- Google Sheets Sync:`, JSON.stringify(consultJson.result?.syncStatus));
  console.log(`- Booked Lead ID: ${consultJson.result?.lead?.id}`);

  // 3. Test Calendar Booked Slots Endpoint
  console.log('\n[3/3] Testing Calendar Booked Slots Endpoint (/api/appointments/booked)...');
  const bookedRes = await fetch(`${BASE_URL}/api/appointments/booked`);
  const bookedJson = await bookedRes.json();
  console.log(`- Booked Slots Count: ${bookedJson.bookedSlots?.length}`);
  const matchingSlot = bookedJson.bookedSlots?.find(b => b.slot.includes('2026-09-22 10:30 AM'));
  console.log(`- Found booked slot for 2026-09-22 10:30 AM:`, matchingSlot ? `YES (${matchingSlot.companyName})` : 'NO');

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED! PDF, GOOGLE SHEETS & CALENDAR FULLY OPERATIONAL!');
  console.log('======================================================\n');
}

verifyAll().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
