import UIKit
import AVFoundation
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate, AVAudioPlayerDelegate {
  private var welcomePlayer: AVAudioPlayer?
  private var welcomeWork: DispatchWorkItem?
  private let welcomeKey = "welcome.lastPlayedAt"
  private var canPlayWelcome: Bool {
    guard let lastPlayed = UserDefaults.standard.object(forKey: welcomeKey) as? Date else { return true }
    return Date().timeIntervalSince(lastPlayed) >= 60 * 60
  }

  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "FeDairy",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  func applicationDidBecomeActive(_ application: UIApplication) {
    guard welcomePlayer == nil, canPlayWelcome else { return }
    welcomeWork?.cancel()
    let work = DispatchWorkItem { [weak self] in self?.playWelcome() }
    welcomeWork = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8, execute: work)
  }

  private func playWelcome() {
    guard UIApplication.shared.applicationState == .active, canPlayWelcome,
          let url = Bundle.main.url(forResource: "welcome_hi", withExtension: "wav") else { return }
    do {
      // Respect silent mode and mix with any audio the user already has playing.
      try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
      try AVAudioSession.sharedInstance().setActive(true)
      welcomePlayer = try AVAudioPlayer(contentsOf: url)
      welcomePlayer?.delegate = self
      if welcomePlayer?.play() == true {
        UserDefaults.standard.set(Date(), forKey: welcomeKey)
      } else {
        stopWelcome()
      }
    } catch {
      stopWelcome()
    }
  }

  func applicationWillResignActive(_ application: UIApplication) {
    welcomeWork?.cancel()
    welcomeWork = nil
    stopWelcome()
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    stopWelcome()
  }

  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
    stopWelcome()
  }

  private func stopWelcome() {
    welcomePlayer?.stop()
    welcomePlayer = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
