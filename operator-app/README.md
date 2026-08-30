# PPFStudio Operator App

This Expo scaffold is the Arabic/English operator-side client for the PPFStudio voice-call signaling service. It connects to the existing `/api/call-signaling` WebSocket using a server-issued call ID and the `PPF_OPERATOR_SIGNALING_TOKEN` value.

## Local setup

Install dependencies inside this directory with `npm install`, then set `EXPO_PUBLIC_PPFSTUDIO_API_URL` to the full-stack website origin. The operator token must be delivered through a secure device provisioning flow; do not commit it to this repository or ship it in a public build configuration.

Start the app with `npm run start` and open it on an Android development build. The current screen intentionally implements the signaling connection and bilingual call-state UI. A production voice channel still requires a development build with `react-native-webrtc` (or an equivalent native WebRTC module), microphone permission handling, and peer connection offer/answer wiring.

## TURN/ICE

The website's `calls.createSession` response includes the server-configured ICE list. If `PPF_TURN_URL`, `PPF_TURN_USERNAME`, and `PPF_TURN_CREDENTIAL` are incomplete, the server returns only the configured STUN fallback. Production TURN credentials should be short-lived when the TURN provider supports them.

## Operator flow

The operator receives a call ID from the business notification/deep-link layer, enters it in the screen, and connects with the operator token. The signaling layer reports `ringing`, forwards offer/answer/ICE messages, and reflects `connected`, `ended`, or `error` states. No fake audio or simulated call completion is used.
