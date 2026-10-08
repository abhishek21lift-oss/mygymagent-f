import { PRODUCT_NAME } from "@/lib/brand";

/**
 * The public site's pages beyond the landing page: one page per thing a
 * gym owner searches for, and articles that answer their questions. Kept
 * as data so the pages, the sitemap and the landing page's links all read
 * one list.
 *
 * Everything here describes what the product does today. A claim a page
 * makes has to be one a new gym can check in the free trial.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface FeaturePage {
  slug: string;
  /** The page's <h1>. */
  title: string;
  /** <title>, before the site name the template adds. */
  metaTitle: string;
  /** Under ~155 characters. */
  description: string;
  /** One line under the heading: the problem, in the owner's words. */
  lede: string;
  steps: { title: string; body: string }[];
  points: string[];
  faqs: FaqItem[];
}

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: "whatsapp-reminders",
    title: "WhatsApp renewal and payment reminders for gyms",
    metaTitle: "Gym WhatsApp Reminder Software",
    description:
      "Send membership renewal, payment due and win-back reminders on WhatsApp from your gym's own number, automatically, in English, Hindi or Hinglish.",
    lede: "Most renewals are lost to silence, not to price. A reminder on the day it matters brings members back before they drift.",
    steps: [
      { title: "Connect your number", body: "Link the gym's WhatsApp by scanning a QR code, the way you link WhatsApp Web. Messages go out from your number, so members recognise it." },
      { title: "Choose what goes out", body: "Renewal reminders before a membership ends, payment reminders for dues, PT package expiry, and a message when a regular stops coming." },
      { title: "Let it run", body: "Reminders send on their own and stop the moment a member renews or pays. You can also write a message yourself and schedule it." },
    ],
    points: [
      "Messages go out from your own WhatsApp number",
      "Renewal, payment due, PT expiry and win-back reminders",
      "Stops automatically once the member pays or renews",
      "Messages spaced out so your number stays in good standing",
      "Schedule a one-off message for a holiday notice or a new batch",
      "Every message logged against the member",
    ],
    faqs: [
      { q: "Do I need the WhatsApp Business API?", a: "No. You link your existing number by scanning a QR code. There is no Meta approval process and no per-template fee." },
      { q: "Can reminders be in Hindi?", a: "Yes. Write them in English, Hindi or Hinglish; members get exactly the words you choose." },
      { q: "Will it message a member who already paid?", a: "No. Each reminder run checks the member's membership and dues first, and skips anyone who has already renewed or paid." },
    ],
  },
  {
    slug: "attendance-qr-checkin",
    title: "QR code check-in and attendance for gyms",
    metaTitle: "Gym Attendance System with QR Check-in",
    description:
      "Members check in with a QR code at a kiosk or the front desk, or on a biometric turnstile. Expired or unpaid members are stopped at the door automatically.",
    lede: "A register at the desk tells you who signed it, not who came in. Check-in should take a second and refuse anyone whose membership has run out.",
    steps: [
      { title: "Every member gets a code", body: "The code is in the member's app. The desk can also download it to print or send on WhatsApp." },
      { title: "Scan at the door", body: "Use a tablet as a self check-in kiosk with a USB scanner or its camera, check members in at the desk, or connect a biometric turnstile." },
      { title: "The door decides", body: "An active membership with no overdue invoice gets in. Anyone else is turned away with the reason, and the attempt is recorded." },
    ],
    points: [
      "Self check-in kiosk on any tablet",
      "Biometric turnstiles: enrol once, works on every scanner at the branch",
      "Refuses expired memberships and overdue invoices at the door",
      "Codes renew by themselves every 30 days, or on demand if one is shared",
      "Live view of who is inside right now",
      "Visit history and streaks for every member",
    ],
    faqs: [
      { q: "Do I need special hardware?", a: "No. A tablet or phone is enough for the kiosk. A USB QR scanner makes it faster, and biometric turnstiles are supported if you have them." },
      { q: "What if a member's code is shared?", a: "Rotate it from the member's profile. The old code stops working at once, and the member sees the new one in their app." },
      { q: "Can members check in at another branch?", a: "Check-in follows your branch rules: a kiosk admits members of its own branch, and staff can check a member in anywhere they have access." },
    ],
  },
  {
    slug: "personal-training",
    title: "Personal training management software",
    metaTitle: "PT Management Software for Gyms and Trainers",
    description:
      "Sell PT packages, assign coaches, book sessions without double-booking, log workouts set by set and pay trainer commissions, in one place.",
    lede: "PT is where a gym earns the most per member and loses the most to forgotten sessions, double bookings and commission arguments.",
    steps: [
      { title: "Sell a package", body: "Sell PT packages by sessions or time, with the price and coach on record. Sessions used are counted as they are completed." },
      { title: "Book and train", body: "Book sessions on the calendar. A coach can't be booked twice for the same time. Trainers log sets, reps and weights from their phone during the session." },
      { title: "Pay fairly", body: "Commission rules per trainer, as a percentage, a flat amount or both, turn completed sessions into a commission ledger for payroll." },
    ],
    points: [
      "PT packages with sessions remaining, and an expiry reminder",
      "Calendar with clash checks across PT sessions and appointments",
      "Workout plans and diet plans delivered to the member's app",
      "Set-by-set session logging on the trainer's phone",
      "Measurements and fitness tests to show progress",
      "Trainer commissions calculated from completed sessions",
    ],
    faqs: [
      { q: "Can trainers use it on their phone?", a: "Yes. Trainers get their own view with today's sessions, their members, and a session screen for logging sets." },
      { q: "How are commissions calculated?", a: "Each trainer has a rule: a percentage of the session price, a flat amount per session, or both. A rule can apply to one session type or to all of them." },
      { q: "Do members see their workouts?", a: "Yes. Workout and diet plans appear in the member's app, along with their sessions and progress." },
    ],
  },
  {
    slug: "gym-billing",
    title: "Gym billing, invoices and dues tracking",
    metaTitle: "Gym Billing Software with Invoices and Dues",
    description:
      "Record cash, UPI, card and bank payments, raise invoices automatically and see exactly who owes how much, largest balance first.",
    lede: "Part payments and 'I'll pay next week' are normal at an Indian gym. The software has to keep score so you don't have to.",
    steps: [
      { title: "Sell a plan", body: "Sell a membership with or without a discount. The invoice raises itself and the member's balance is tracked from day one." },
      { title: "Record what's paid", body: "Cash, UPI, card or bank transfer, in full or in part. Receipts reach the member automatically." },
      { title: "Collect what's owed", body: "The dashboard shows the outstanding total, and one tap lists every member who owes, largest balance first, with their phone number." },
    ],
    points: [
      "Cash, UPI, card and bank transfer payments",
      "Part payments with the balance tracked per membership",
      "Invoices raised automatically, with refunds handled",
      "Outstanding balances list, largest first",
      "Expenses with approval, and daily collection on the dashboard",
      "Payment reminders on WhatsApp",
    ],
    faqs: [
      { q: "Can a member pay in instalments?", a: "Yes. Record each payment as it comes; the membership shows what's paid and what's left until the balance is cleared." },
      { q: "Does it handle refunds?", a: "Yes. A refund is recorded against the payment, and every total, including the outstanding balance, accounts for it." },
      { q: "Can I see collections by branch?", a: "Yes. Every figure on the dashboard can be narrowed to one branch." },
    ],
  },
  {
    slug: "member-app",
    title: "A member app for your gym",
    metaTitle: "Gym Member App: Check-in, Plans and Workouts",
    description:
      "Give members an app with their check-in QR code, membership, workouts, diet plan, classes, bills and progress. They sign in with their phone number.",
    lede: "Members ask the desk the same questions every day: when does my plan end, how much do I owe, what's my workout. The app answers them.",
    steps: [
      { title: "Turn it on", body: "From a member's profile, switch on app access. They sign in with their phone number and a one-time code. No passwords to forget." },
      { title: "Everything in one place", body: "Their check-in code, membership and renewal date, workouts, diet plan, class bookings, bills and visit history." },
      { title: "Stay in touch", body: "Plans the trainer assigns appear straight away, and members can renew from the app." },
    ],
    points: [
      "Phone number sign-in with a one-time code",
      "Check-in QR code that works at the kiosk",
      "Membership, renewal date and balance due",
      "Workouts and diet plans from their trainer",
      "Class bookings and visit history",
      "Progress: measurements and goals",
    ],
    faqs: [
      { q: "Do members need to download anything?", a: "No. The member app works in the phone's browser and can be added to the home screen like an app." },
      { q: "Can I control who gets access?", a: "Yes. App access is switched on per member from their profile, and can be turned off the same way." },
      { q: "Is it in my gym's name?", a: "Members see your gym's name and their own data, nothing from any other gym." },
    ],
  },
];

export function featurePage(slug: string): FeaturePage | undefined {
  return FEATURE_PAGES.find((page) => page.slug === slug);
}

/** A block of an article: prose, a list, a sub-heading or a message to copy. */
export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "template"; label: string; text: string };

export interface Article {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD. */
  published: string;
  updated?: string;
  readingMinutes: number;
  blocks: ArticleBlock[];
}

/**
 * Who articles are written by. Set the author's name and credentials in
 * the environment to give every article a real byline; until then they
 * are signed by the team.
 */
export const ARTICLE_AUTHOR = {
  name: process.env.NEXT_PUBLIC_CONTENT_AUTHOR_NAME?.trim() || `The ${PRODUCT_NAME} team`,
  bio:
    process.env.NEXT_PUBLIC_CONTENT_AUTHOR_BIO?.trim() ||
    "Written with personal trainers and gym owners who run their floor on the app every day.",
};

export const ARTICLES: Article[] = [
  {
    slug: "gym-renewal-whatsapp-message-templates",
    title: "Gym membership renewal WhatsApp messages: 12 templates in English, Hindi and Hinglish",
    description:
      "Copy-ready WhatsApp messages for gym renewals, payment dues, expired members and win-backs, with when to send each one and what to avoid.",
    published: "2026-10-08",
    readingMinutes: 7,
    blocks: [
      { type: "p", text: "A renewal reminder works when it reaches the member before the decision is made, from a number they recognise, in words that sound like the gym and not like a bank. Below are the messages that work at Indian gyms, grouped by when to send them." },
      { type: "h2", text: "When to send" },
      { type: "ul", items: [
        "7 days before the plan ends: a friendly heads-up with the renewal price.",
        "1 day before: a short reminder with how to renew today.",
        "The day after it ends: let them know the plan has ended and the door will stop their check-in.",
        "7 and 21 days after: a win-back, ideally with a reason to come back, not just a discount.",
      ] },
      { type: "p", text: "Send between 10 AM and 8 PM. Messages at night feel like spam, and early-morning members read them at the gym anyway." },
      { type: "h2", text: "Before the plan ends" },
      { type: "template", label: "7 days before (English)", text: "Hi {first_name}, your {plan_name} at {gym_name} ends on {end_date}. Renew before then to keep your streak going. Reply RENEW and we'll set it up, or pay at the desk on your next visit." },
      { type: "template", label: "7 days before (Hinglish)", text: "Hi {first_name}! Aapka {plan_name} plan {end_date} ko khatam ho raha hai. Streak mat todiye 💪 Renew karne ke liye RENEW reply kijiye, ya next visit pe desk pe pay kar dijiye." },
      { type: "template", label: "7 days before (Hindi)", text: "नमस्ते {first_name}, {gym_name} में आपका {plan_name} प्लान {end_date} को समाप्त हो रहा है। प्लान जारी रखने के लिए RENEW लिखकर जवाब दें, या अगली बार डेस्क पर भुगतान करें।" },
      { type: "template", label: "1 day before (English)", text: "Hi {first_name}, a quick reminder that your membership ends tomorrow. Renew today and there's no gap in your training. See you at the gym!" },
      { type: "template", label: "1 day before (Hinglish)", text: "{first_name}, kal aapka membership end ho raha hai. Aaj renew kar lijiye taaki training mein break na aaye. Milte hain gym mein!" },
      { type: "h2", text: "Payment due" },
      { type: "template", label: "Balance due (English)", text: "Hi {first_name}, a balance of ₹{amount} is pending on your {plan_name}. You can pay by UPI or at the desk. Thank you!" },
      { type: "template", label: "Balance due (Hinglish)", text: "Hi {first_name}, aapke {plan_name} par ₹{amount} pending hai. UPI se ya desk par pay kar sakte hain. Thank you!" },
      { type: "p", text: "Keep payment messages short and neutral. Never mention the amount in a group or a status update, and stop the reminders the moment the member pays." },
      { type: "h2", text: "After the plan has ended" },
      { type: "template", label: "Plan ended (English)", text: "Hi {first_name}, your membership ended on {end_date}, so check-in at the door will be paused. Renew any time and you're straight back in." },
      { type: "template", label: "Win-back after 7 days (Hinglish)", text: "{first_name}, gym aapko miss kar raha hai! Wapas aaiye, pehla week aapke purane trainer ke saath plan bana denge. Renew karne ke liye reply kijiye." },
      { type: "template", label: "Win-back after 21 days (English)", text: "Hi {first_name}, it's been a few weeks. If timings or a niggle kept you away, tell us and we'll work around it. Your progress is still on record whenever you're ready." },
      { type: "h2", text: "What to avoid" },
      { type: "ul", items: [
        "Sending the same message three days in a row. Space them out and change the words.",
        "Messaging someone who already renewed. Nothing loses trust faster.",
        "Discounts in every message. They teach members to wait for the next one.",
        "Long paragraphs. One idea per message, and a clear next step.",
      ] },
      { type: "p", text: `In ${PRODUCT_NAME}, these reminders go out from your gym's own WhatsApp number on the schedule above, and stop by themselves when the member renews or pays.` },
    ],
  },
  {
    slug: "how-to-reduce-gym-member-churn",
    title: "How to reduce gym member churn: a practical playbook for Indian gyms",
    description:
      "Why members quit in the first 90 days, the early warning signs to watch, and a weekly routine that keeps more members renewing.",
    published: "2026-10-08",
    readingMinutes: 6,
    blocks: [
      { type: "p", text: "Most members who leave a gym decide to in the first three months, and most of them never say so. They come less, then stop, then let the plan run out. Churn is lost before the renewal date; the renewal date is just when you notice." },
      { type: "h2", text: "The warning signs" },
      { type: "ul", items: [
        "Visits dropping: someone who came 4 times a week now comes once.",
        "No visit in 10 to 14 days, for a member who used to come regularly.",
        "No trainer, no plan: members without a programme have no reason to come on a tired day.",
        "Unpaid balance: a member who owes money avoids the desk, and then the gym.",
      ] },
      { type: "h2", text: "The first 90 days" },
      { type: "ul", items: [
        "Week 1: a short assessment (weight, a few measurements, one strength or fitness test) and a written plan. It gives them a starting point to beat.",
        "Week 2: a check-in from a trainer, in person or on WhatsApp: how is the plan going?",
        "Week 4: retest one number from the assessment. Seeing progress is the strongest reason to stay.",
        "Week 8 to 12: talk about the next goal before the renewal conversation.",
      ] },
      { type: "h2", text: "A 20-minute weekly routine" },
      { type: "ul", items: [
        "List members who haven't visited in 10+ days and message them personally, not with a template.",
        "List members whose plan ends in the next 14 days and speak to them in person on their next visit.",
        "Clear outstanding balances gently: a small balance left alone becomes a lost member.",
        "Ask trainers which of their members seem unmotivated, and change something in their plan.",
      ] },
      { type: "h2", text: "What doesn't work" },
      { type: "ul", items: [
        "Big renewal discounts at the last minute. They reward waiting and cut your margin.",
        "Generic broadcast messages to everyone. Members can tell, and they mute the number.",
        "Locking members into long plans they don't use. They don't come back after it ends.",
      ] },
      { type: "p", text: `${PRODUCT_NAME} flags members at risk from their visit pattern and dues, sends win-back messages when a regular goes quiet, and puts renewals due and balances owed on the dashboard every morning.` },
    ],
  },
  {
    slug: "how-to-price-personal-training-packages",
    title: "How to price personal training packages in India",
    description:
      "A simple way to price PT sessions and packages from your costs and your trainers' value, with package structures that sell and commission models that stay fair.",
    published: "2026-10-08",
    readingMinutes: 6,
    blocks: [
      { type: "p", text: "PT is usually the most profitable thing a gym sells, and the most often under-priced. Start from what an hour of a trainer's time has to earn, then build packages that reward commitment without giving the hour away." },
      { type: "h2", text: "Start with the price of one session" },
      { type: "ul", items: [
        "What the trainer earns per session (salary share or commission).",
        "What the floor, equipment and overheads cost for that hour.",
        "What the gym needs to keep as margin.",
        "Then check it against what similar gyms nearby charge, and the trainer's experience and results.",
      ] },
      { type: "p", text: "If the number you reach is far below the local market, raise it. If it is far above, the package has to show why: certification, a track record, measurable results." },
      { type: "h2", text: "Package structures that sell" },
      { type: "ul", items: [
        "12 sessions in 30 days: the entry package. Three sessions a week is enough to see results.",
        "24 sessions in 60 days: a small per-session saving for committing to two months.",
        "36 sessions in 90 days: the best per-session price, for members with a goal and a date.",
        "Always give packages an expiry. Sessions without one get forgotten, then argued about.",
      ] },
      { type: "p", text: "Keep the per-session saving modest, around 5 to 15 percent between tiers. Bigger cuts make the single-month package look like a bad deal and devalue the trainer's time." },
      { type: "h2", text: "Paying trainers fairly" },
      { type: "ul", items: [
        "Percentage of the session price: simple, and rewards trainers who sell higher packages.",
        "Flat amount per session: predictable for both sides, good for newer trainers.",
        "Both: a small flat amount plus a percentage keeps every session worth doing.",
        "Pay on completed sessions only, from a record both sides can see.",
      ] },
      { type: "h2", text: "Show the value" },
      { type: "ul", items: [
        "An assessment at the start and every four weeks: weight, measurements, a strength test.",
        "A written programme the member can see on their phone.",
        "A short note after each session: what was done and what's next.",
      ] },
      { type: "p", text: `${PRODUCT_NAME} sells PT packages with session counts and expiry, books sessions without double-booking a coach, logs every set, and turns completed sessions into trainer commissions by each trainer's rule.` },
    ],
  },
];

export function article(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** "8 Oct 2026". */
export function articleDate(iso: string): string {
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
