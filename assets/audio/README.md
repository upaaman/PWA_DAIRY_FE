# Daily Hindi welcome

`welcome_hi.wav` says: “नमस्ते उपाध्याय जी। जय श्री महाकाल, जय श्री राम।”
Synthesized with the macOS Lekha Hindi voice, with short leading/trailing silence
for a five-second clip. Bundled locally; no network or microphone permission.

iOS references this file directly from the Xcode Resources phase. Android bundles
an identical copy at `android/app/src/main/res/raw/welcome_hi.wav`; update both
copies together if replacing the recording.

Playback is scheduled after the activity/app becomes active, once per local calendar
day. Successful completion saves the playback start date in Android SharedPreferences
/ iOS UserDefaults. The old first-launch flag is ignored. Backgrounding cancels
pending playback and stops current playback; incomplete playback can retry later.
Device volume and iOS silent mode are respected. No greeting-specific UI is added.

Device verification after a native rebuild:
1. On a fresh installation with sound enabled, open the app: hear the full Hindi greeting once.
2. Close and reopen on the same date: no repeat.
3. Open on the next local calendar day: the greeting plays again.
4. With app data reset, background during the greeting: sound stops; reopening retries.
5. Navigate through the app after completion: normal functionality and no repeat.

Reloading JavaScript alone will not install native code or bundled resource changes.
