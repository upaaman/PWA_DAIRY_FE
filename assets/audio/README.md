# Hindi welcome with one-hour cooldown

`welcome_hi.wav` says: “नमस्ते उपाध्याय जी। जय श्री महाकाल, जय श्री राम।”
The bundled five-second recording works offline.

On each app open/foreground, Android and iOS check the last playback timestamp.
The greeting starts only if at least 60 minutes have passed, or it has never played.
The timestamp is saved when playback starts, so backgrounding, restarting, or
opening the photo picker cannot immediately repeat it. Failed playback startup
leaves the timestamp unchanged. Backgrounding stops audio. Device volume and iOS
silent mode are respected. No timer plays audio while the app remains open.

Android bundles a copy at `android/app/src/main/res/raw/welcome_hi.wav`.
iOS references `assets/audio/welcome_hi.wav` in its Resources phase.
Update both files together if replacing the recording.

Verify on device: open and hear it once; reopen within an hour and hear nothing;
open after an hour and hear it again. Native changes require rebuilding the app.
