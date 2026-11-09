/* ============================================================
   RR Hospitals — demo settings. Edit this file before the meeting.
   Departments, doctors and price ranges live at the top of data.js
   (DEPTS, STAFF, SERVICES) — swap in RR's real ones there.
   ============================================================ */
window.RR = window.RR || {};
window.RR.CONFIG = {
  hospital: 'RR Hospitals',
  city: 'Bengaluru',
  owner: 'Asim',

  /* Tally: ledger names used in the exported XML. Match them to RR's chart of accounts. */
  tally: {
    company: 'RR Hospitals',
    income: dept => `Hospital Income - ${dept}`, // Sales Accounts
    selfPay: 'Patient Receivables',               // Sundry Debtors
    insurer: name => `${name} (TPA)`,              // Sundry Debtors
    cash: 'Cash',                                  // Cash-in-Hand
    upi: 'UPI Collections - HDFC Bank',            // Bank Accounts
    card: 'Card Settlements - HDFC Bank',          // Bank Accounts
    bank: 'HDFC Bank Current A/c',                 // Bank Accounts (NEFT, insurer settlements)
    deductions: 'TPA Deductions',                  // Indirect Expenses
  },

  /* Closing slide (#proposal). Placeholder figures — set the real offer. */
  proposal: {
    weeks: 6,
    price: '₹3,50,000',
    priceNote: 'one-time setup, then ₹18,000 a month',
    phase1: ['Billing, receipts and daily closing', 'Insurance claims and TPA follow-up', 'Paper registers scanned into the ledger', 'Tally export for the accounts team'],
    contact: 'Siddharth Bhat',
  },
};
