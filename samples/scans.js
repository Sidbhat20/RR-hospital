/* ============================================================
   Register pages for the scan demo. Each page's rows are both
   what's written on the photo and the prepared reading, so the
   demo never fails in the room.

   To add RR's own page: put the photo in samples/ (blur names
   first), add an entry below with the rows typed exactly as
   written, and list its file name in `files`. Any upload with
   that file name — or the exact same image — reads as this page.
   `check` marks fields the reader is unsure of; they're flagged
   for the person approving.
   ============================================================ */
window.RR = window.RR || {};
window.RR.SCANS = [
  {
    id: 'opd', title: 'OPD register', sub: 'Front desk · this week', img: 'samples/opd.jpg', files: ['opd.jpg'],
    book: 'OPD REGISTER', page: 'Page 112', date: '2026-11-07', ink: '#1d2f6f', tilt: -1.6,
    rows: [
      { name: 'Ravi Kumar', sex: 'M', age: 46, dept: 'Cardiology', service: 'Consultation', amount: 800, pay: 'Cash', hand: 'Ravi Kumar | M/46 | Cardio OPD | 800 | cash' },
      { name: 'Shabana Begum', sex: 'F', age: 38, dept: 'Maternity', service: 'Consultation', amount: 600, pay: 'UPI', hand: 'Shabana Begum | F/38 | ANC check | 600 | UPI' },
      { name: 'Manjunath S', sex: 'M', age: 61, dept: 'Orthopedics', service: 'Imaging', amount: 1200, pay: 'Cash', hand: 'Manjunath S | M/61 | Ortho + X-ray knee | 1200 | cash' },
      { name: 'Divya Prakash', sex: 'F', age: 29, dept: 'Neurology', service: 'Consultation', amount: 900, pay: 'Card', hand: 'Divya Prakash | F/29 | Neuro OPD | 900 | card' },
      { name: 'Baby Arnav', sex: 'M', age: 3, dept: 'Pediatrics', service: 'Lab Panel', amount: 650, pay: 'UPI', hand: 'Baby Arnav | M/3 | Paeds fever, CBC | 650 | UPI', check: ['age'] },
      { name: 'Gopal Rao', sex: 'M', age: 72, dept: 'Cardiology', service: 'Lab Panel', amount: 1450, pay: 'Due', hand: 'Gopal Rao | M/72 | ECG + lipid | 1450 | due' },
    ],
  },
  {
    id: 'ward', title: 'Ward ledger, 2019', sub: 'Ward B · faded ink', img: 'samples/ward.jpg', files: ['ward.jpg'],
    book: 'WARD B — ADMISSIONS', page: 'Page 14', date: '2019-03-14', ink: '#3a3a52', tilt: 1.2, faded: true,
    rows: [
      { name: 'Lakshmi Devi', sex: 'F', age: 62, dept: 'Orthopedics', service: 'Inpatient Stay', amount: 18500, pay: 'Cash', hand: 'Smt. Lakshmi Devi | F/62 | knee repl. 4 days | 18,500 | paid' },
      { name: 'Ramesh Gowda', sex: 'M', age: 45, dept: 'Cardiology', service: 'Inpatient Stay', amount: 24000, pay: 'Due', hand: 'Ramesh Gowda | M/45 | chest pain obs. 3 d | 24,000 | bal. due' },
      { name: 'Saroja Bai', sex: 'F', age: 55, dept: 'Oncology', service: 'Therapy', amount: 16000, pay: 'Cash', hand: 'Saroja Bai | F/55 | chemo cycle 2 | 16,000 | paid', check: ['amount'] },
      { name: 'Abdul Rahim', sex: 'M', age: 39, dept: 'Emergency', service: 'Inpatient Stay', amount: 9800, pay: 'Cash', hand: 'Abdul Rahim | M/39 | RTA, obs 2 days | 9,800 | paid' },
      { name: 'Kamala Shetty', sex: 'F', age: 68, dept: 'Neurology', service: 'Imaging', amount: 6500, pay: 'Due', hand: 'Kamala Shetty | F/68 | CT brain | 6,500 | due' },
    ],
  },
  {
    id: 'casualty', title: 'Casualty book', sub: 'Night shift · rushed', img: 'samples/casualty.jpg', files: ['casualty.jpg'],
    book: 'CASUALTY', page: 'Page 5', date: '2026-11-08', ink: '#20304f', tilt: -2.4, messy: true,
    rows: [
      { name: 'Unknown male', sex: 'M', age: 30, dept: 'Emergency', service: 'Consultation', amount: 500, pay: 'Due', hand: 'Unknown M ~30 | RTA, dressing | 500 | —', check: ['name', 'age'] },
      { name: 'Prakash N', sex: 'M', age: 52, dept: 'Cardiology', service: 'Lab Panel', amount: 2200, pay: 'UPI', hand: 'Prakash N | M/52 | chest pain ECG trop | 2200 | UPI' },
      { name: 'Fathima Z', sex: 'F', age: 24, dept: 'Emergency', service: 'Therapy', amount: 3800, pay: 'Cash', hand: 'Fathima Z | F/24 | asthma neb + obs | 3800 | cash' },
      { name: 'Suresh B', sex: 'M', age: 47, dept: 'Orthopedics', service: 'Imaging', amount: 1500, pay: 'Card', hand: 'Suresh B | M/47 | fall, wrist Xray | 1500 | card' },
    ],
  },
];
