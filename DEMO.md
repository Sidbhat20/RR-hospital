# RR Hospitals — 5-minute demo

**Before you start:** open https://rr-hospital.vercel.app, then press the reset button at the bottom of the sidebar (↻ next to Asim), or **More › Reset demo data** on a phone. Close every other tab and turn off notifications.

| # | Time | Where | Do | Say |
|---|------|-------|----|-----|
| 1 | 0:00 | **Scan a page** | Click the **OPD register** sample (or upload their own photo). | "This is page 112 of your OPD register. Watch." |
| 2 | 0:15 | Reading… | Let it run (3 seconds). | "It straightens the page, finds the rows, reads the handwriting." |
| 3 | 0:25 | Check the draft | Point at the one red field (Baby Arnav's age). Fix or confirm it. | "Anything it isn't sure of is marked. A person approves, nothing posts on its own." |
| 4 | 0:50 | **Approve and post** | Click it. | "Six bills, ₹5,600, in the ledger. The paper page is kept against each bill." |
| 5 | 1:05 | **Billing** | Show the new bills at the top. Switch Today › Month. | "Same bills, now searchable, with what's paid and what's owed." |
| 6 | 1:40 | **Ask** | Type: *how much is stuck with insurers* | "Ask it like you'd ask your accountant." |
| 7 | 2:10 | **Insurance claims** | Read the red line out loud. Click **Over 30 days**. | "This is money you've earned and haven't been paid. Here's which TPA, which patient, how many days." |
| 8 | 3:00 | **Daily closing** | Type a cash figure ₹200 lower than the ledger. **Close the day**. | "Tonight's drawer against what was billed. It catches the ₹200 the same evening, not at month-end." |
| 9 | 3:40 | **Billing › Send to Tally** | Pick *This month*, download. | "Your accountant keeps Tally. This file imports straight in: sales, receipts, TPA deductions." |
| 10 | 4:20 | **Proposal** | Go to `/#proposal` (Esc to leave). | Read the slide. Stop talking. |

## If something goes wrong
- **Wrong screen state:** press reset and start again from step 1. Nothing is lost.
- **No internet:** the site works offline after one visit. Open it once on the venue Wi-Fi before the meeting.
- **Their own photo isn't recognised:** it says so and offers manual entry. Use the sample pages instead.

## Using their real register page
1. Get a photo of one real page and blur the patient names.
2. Save it as `samples/rr-page.jpg`.
3. Add an entry to `samples/scans.js` (copy the `opd` one): set `img` and `files: ['rr-page.jpg']` and type each row exactly as written. Use `check: ['age']` for anything hard to read.
4. Bump `CACHE` in `sw.js`, then `vercel deploy --prod`.

Uploading that same file (or any file named `rr-page.jpg`) reads as the prepared page.

## Make it theirs (edit before the meeting)
- `config.js`: hospital name, city, Tally ledger names, the proposal's weeks and price.
- `data.js`: `DEPTS`, `STAFF` (doctors) and `SERVICES` (price ranges). Bump `KEY` to `rr-hospitals-db-v6` after changing them so every browser reseeds.

## Doctors and shifts
Ask in chat, for example:
- "How many patients has Dr Vikram Menon attended in his shift?"
- "Who did Dr Kiran Bhat see last night?" (lists the patients)
- "How many patients has the cardiologist seen this week?"
- "Which doctor saw Priya Shah?"
- "How many patients have the doctors seen today?" / "Who is on shift now?"

The **Doctors** page shows each doctor's shift, a live dot for who's on now, and the patient list for any of the last 7 shifts. **Log a visit** adds one.
Shifts are set in `doctors.js` (`SHIFTS`, `ROSTER`). Morning 08–14, evening 14–20, night 20–08. A night shift belongs to the day it started.
