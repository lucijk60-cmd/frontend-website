# PPFStudio WebRTC Calling Backend — Phase 1

এই phase-এ PPFStudio-এর Arabic-English calling system-এর backend foundation তৈরি হয়েছে। এটি এখন call session তৈরি, customer token নিরাপত্তা, database lifecycle এবং WebSocket signaling relay পরিচালনা করে। **Audio media এখনো WebRTC peer connection দিয়ে চালু হয়নি**; পরবর্তী phase-এ website call UI এবং Android operator client এই signaling channel ব্যবহার করবে।

## Session flow

1. Customer website `calls.createSession` mutation চালায়।
2. Server `callId` এবং একবার ব্যবহারের জন্য customer token তৈরি করে; database-এ token-এর SHA-256 hash সংরক্ষণ করে।
3. Customer WebSocket-এ `/api/call-signaling?callId=...&role=customer&token=...` দিয়ে যুক্ত হবে।
4. Operator Android app একই `callId`-এ `role=operator` এবং server-side `PPF_OPERATOR_SIGNALING_TOKEN` দিয়ে যুক্ত হবে।
5. WebSocket validated `offer`, `answer`, `ice-candidate`, `accept`, `reject` এবং `end` message দুই peer-এর মধ্যে relay করে। Audio বা recording server-এ সংরক্ষণ করা হয় না।
6. Session lifecycle database-এ `calling`, `ringing`, `connecting`, `connected`, `ended`, `rejected`, `busy`, `failed` ইত্যাদি status হিসেবে লেখা হয়।

## API procedures

| Procedure | Access | Purpose |
|---|---|---|
| `calls.createSession` | Public, rate-limited | নতুন call session ও customer token তৈরি করে |
| `calls.status` | Public token-protected | নিজের session-এর lifecycle status দেখে |
| `calls.end` | Public token-protected | নিজের active session শেষ করে |

## Required operator configuration

Operator app-এর জন্য server environment-এ `PPF_OPERATOR_SIGNALING_TOKEN` একটি দীর্ঘ random secret হিসেবে দিতে হবে। এটি client-side website code-এ রাখা যাবে না। Token না থাকলে operator WebSocket connection ইচ্ছাকৃতভাবে reject হবে। বাস্তব deployment-এর আগে HTTPS/WSS, Android microphone permission, TURN server এবং operator push-notification configuration যোগ করতে হবে।

## Hosting note

WebSocket connection-এর জন্য full-stack Node.js deployment ব্যবহার করতে হবে; static IONOS package দিয়ে এই signaling service চলবে না। Multiple-instance production setup হলে connection state database বা shared broker-এ রাখা এবং persistent/reserved hosting নির্বাচন করা উচিত।
