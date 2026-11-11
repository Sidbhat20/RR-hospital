# RR Hospitals: brief for the demo video

Use this as the full context. Where it says "not confirmed", don't put it on screen.

## Who it's for
- **Client:** RR Hospitals, a mid-size private hospital in Bengaluru.
- **Viewer:** the owner, **Asim** (still to be confirmed as the decision-maker). He is a business owner, not a tech person. He cares about money coming in, money stuck, and staff time.
- **Goal of the video:** make him want Phase 1. It should feel like his hospital, a month after switching.

## The problem RR has today
RR runs on **pen-and-paper registers**: OPD books, ward ledgers and casualty books. That causes these problems:
1. **No one knows the day's real numbers** until someone adds up the registers, usually late or never.
2. **Money is stuck with insurers.** Claims sit with TPAs (Star Health, HDFC ERGO, Niva Bupa, ICICI Lombard, PM-JAY, CGHS) for weeks. Some get queried, and some get short-paid with deductions. Nobody tracks which ones.
3. **Patients leave without paying**, and the dues aren't followed up.
4. **The cash drawer doesn't always match** what was billed (cash vs UPI vs card), and mismatches go unnoticed.
5. **The accountant re-types everything into Tally** by hand.
6. **Years of old registers** sit on shelves, unsearchable.
7. **No view of which doctor saw which patient** in a shift.

## What we built (the answer)
A web app called **RR Hospitals**. It works in a browser and on phone, and installs like an app. Its idea: *"Move the hospital from paper to digital, with a helper you can just talk to."*

| Feature | What it shows in one line |
|---|---|
| **Ask (chat)** | The home screen. Type a question in plain English, even with typos, and get a plain answer. Charts only appear if you ask ("show the chart"). |
| **Scan a page** | Photograph a handwritten register page. After a short "reading…" step, each line becomes a draft bill to check and approve. Unclear fields are marked. |
| **Insurance claims** | Headline: "**₹X stuck with TPAs for over 30 days**". Shows pending, queried, settled and short-paid claims, by insurer and by age. |
| **Daily closing** | Cash, UPI and card counted at the desk vs what the ledger says. Any mismatch is flagged in red ("Short by ₹500"). |
| **Send to Tally** | One button downloads a file the accountant imports into TallyPrime. No re-typing. |
| **Doctors** | Who is on shift, and how many patients each doctor has seen this shift. You can ask: "How many patients has Dr Menon seen in his shift?" |
| **Billing / Overview / Payments / Expenses / Payroll / Departments** | Today, this week, this month or this year, with a comparison to the previous period. Shows which department makes or loses money. |
| **Every change is safe** | The chat always shows what it will do and waits for a confirm. Everything can be undone. |

## The 5-minute story (the video should follow this order)
1. **Messy paper.** Show a photo of a real-looking handwritten register page.
2. **Scan.** "Reading…" → the clean draft table appears → **Approve and post**.
3. **Clean ledger.** Those lines are now bills in Billing.
4. **One chat question.** For example "How much did we bill today?" or "Who owes us money?", answered in a sentence.
5. **Claims stuck.** Open Insurance claims and land on the red headline about money stuck with TPAs.
6. **Daily closing.** The drawer vs the ledger, with one mismatch flagged.
7. **Send to Tally.** Click the button and the file downloads.
8. **Closing slide.** "Phase 1 live in 8 weeks."

Optional extra beat: "How many patients has Dr Vikram Menon attended in his shift?"

## Example lines that work in the chat (use these exactly)
- "How much did we bill today?"
- "Who owes us money?"
- "How much is stuck with insurers?"
- "Did the cash match today?"
- "How many patients has Dr Vikram Menon seen in his shift?"
- "What's Priya Shah's balance?"
- "Send this month to Tally"
- Typos are fine: "blling tdy" or "dr vikaram" still work.

## Look and feel (match the real app)
- **Style:** calm and premium, like *"scholar's parchment behind clean glass"*. Warm off-white paper, dark ink, lots of space. **It must not look AI-made:** no sparkles, robots, glowing gradients, avatars or neon.
- **Colours:**
  - Background `#faf8f5`, cards `#fdfbfa`, text `#27251e`, grey text `#6b6964`, lines `#e4e1db`.
  - **Teal `#016a71`** is the only accent. Use it for the selected item and focus.
  - **Red `#b3261e`** is used only for money lost or overdue.
- **Font:** Inter, regular and medium weights only. No bold-heavy headings.
- **Money:** always Indian format, like ₹2,28,700 and ₹10.3L.
- **Illustrations:** small flat isometric drawings (ledger, calendar, coins, folder) in the same teal and warm palette. Calm, not cartoonish.
- **Voice:** plain, friendly and short, like a capable colleague. No jargon: say "money stuck with insurers", not "AR ageing".

## Numbers on screen
The app's figures are sample data and shift with the date, so take them from the live app on the day you record. Press **reset** first; on desktop it's the ↻ at the bottom left.
- **Claims headline:** about **₹10.3L stuck with TPAs over 30 days** (96 claims), out of about ₹36L open.
- **Daily billing:** about 15–25 bills a day.
- **Consultation:** ₹500–1,200.
- **Live app:** https://rr-hospital.vercel.app

## Don't claim or show
- **Price:** not confirmed. Don't show ₹3,50,000 / ₹18,000; it's a placeholder. Say "Phase 1 live in 8 weeks" only.
- **Real names:** the departments, doctors and patients are samples, not RR's real staff or patients. Don't present them as real.
- **Scan:** the three sample pages are pre-read for the demo. Don't promise it reads any handwriting perfectly. Say "reads the page into a draft that staff check and approve".
- **Tally:** the export follows Tally's format but hasn't yet been imported into a real TallyPrime. Say "export for Tally", not "tested with your accountant".
- **Chat:** it answers from the hospital's own books. Don't call it ChatGPT or claim it knows anything outside the hospital.

## Phase 1 (what he'd be buying)
- Billing, receipts and daily closing
- Insurance claims and TPA follow-up
- Paper registers scanned into the ledger
- Tally export for the accounts team
- Live in **8 weeks**. Contact: **Siddharth Bhat**.
