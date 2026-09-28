import UIKit
import AVFoundation
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate, AVAudioPlayerDelegate {
  private var welcomePlayer: AVAudioPlayer?
  private var welcomeWork: DispatchWorkItem?
  private let welcomeKey = "welcome.lastPlayedDate"
  private var welcomeStartedAt: Date?

  private var hasPlayedToday: Bool {
    guard let lastPlayed = UserDefaults.standard.object(forKey: welcomeKey) as? Date else { return false }
    return Calendar.current.isDate(lastPlayed, inSameDayAs: Date())
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
    guard !hasPlayedToday, welcomePlayer == nil else { return }
    welcomeWork?.cancel()
    let work = DispatchWorkItem { [weak self] in self?.playWelcome() }
    welcomeWork = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8, execute: work)
  }

  private func playWelcome() {
    guard UIApplication.shared.applicationState == .active,
          !hasPlayedToday,
          let url = Bundle.main.url(forResource: "welcome_hi", withExtension: "wav") else { return }
    do {
      // Respect silent mode and mix with any audio the user already has playing.
      try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
      try AVAudioSession.sharedInstance().setActive(true)
      welcomePlayer = try AVAudioPlayer(contentsOf: url)
      welcomePlayer?.delegate = self
      welcomeStartedAt = Date()
      if welcomePlayer?.play() != true { stopWelcome() }
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
    if flag, let startedAt = welcomeStartedAt {
      UserDefaults.standard.set(startedAt, forKey: welcomeKey)
    }
    stopWelcome()
  }

  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
    stopWelcome()
  }

  private func stopWelcome() {
    welcomePlayer?.stop()
    welcomePlayer = nil
    welcomeStartedAt = nil
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
