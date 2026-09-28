This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

## Bill branding

Name, address, phone numbers and email live in one place — `src/constants/brand.js` — and are used by the generated PDF, the in-app bill preview, the HTML template and the plain-text receipt. Change it there and every bill updates.

The logo and signature are embedded in the PDF itself (the builder is pure JS, so the pixel data is pre-compressed and shipped as data). They come from:

```bash
npm run build:bill-assets
# or point it at other files:
npm run build:bill-assets -- /path/to/logo.png /path/to/signature.png
```

That Node script (`scripts/buildBillBrandAssets.js`) crops the source images to their content, resizes them for print, and writes:

- `assets/bill/*.png` — used by the in-app preview via `<Image>`
- `src/assets/billBrandImages.js` — **generated**, the deflated pixel data the PDF builder embeds

Both outputs are committed, so you only need to re-run this after changing the artwork.

## App name & launcher icon

The name under the icon is **EiiE**. It is set in three places, all of which must agree:

- `app.json` → `displayName` (used by the React Native CLI)
- `android/app/src/main/res/values/strings.xml` → `app_name`
- `ios/FeDairy/Info.plist` → `CFBundleDisplayName`

`app.json`'s `name` and the native project names stay `FeDairy` — they are internal identifiers, not user-facing.

The icon itself is generated from the same logo as the bill:

```bash
npm run build:app-icons
# or point it at another file:
npm run build:app-icons -- /path/to/logo.png
```

`scripts/buildAppIcons.js` centres the badge on a white square and writes:

- `assets/app-icon.png` — the 1024×1024 master, committed so the icons can be rebuilt later
- `ios/FeDairy/Images.xcassets/AppIcon.appiconset/Icon-*.png` — opaque, as iOS requires
- `android/app/src/main/res/mipmap-*/ic_launcher.png` and `ic_launcher_round.png` — the round one is masked to a circle

Tweak `BADGE_RATIO` in the script to change how much of the square the logo fills (0.74 leaves room for the rounded masks both platforms apply). Rebuild, then reinstall the app — launchers cache icons aggressively, so an uninstall is often needed to see the change.

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

### Animal photos

Add/Edit Animal now lets you choose a photo from the device library. The app
uploads it as multipart `file` to `POST /upload`, reads `{ "url": "..." }`, and
saves that value as `imageUrl` in animal create/update requests. Photo-only edits
send only `imageUrl`; unrelated edits preserve the existing photo. Animal list
and detail views show the returned image, with an animal icon if missing or broken.

Uploads support JPG/PNG/WEBP up to 3 MB. Save stays disabled while a photo is
being selected or uploaded; cancelling or failing a replacement retains the old
photo. Uploaded photos are attached to the animal only when Save is pressed.

The native `react-native-image-picker` dependency requires rebuilding the app
(`npm run android`, or install iOS pods then rebuild with Xcode). Fast Refresh
alone cannot load the native photo picker. iOS includes the photo-library usage
message in Info.plist.
