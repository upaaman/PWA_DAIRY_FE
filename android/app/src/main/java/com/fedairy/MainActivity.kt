package com.fedairy

import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  private val welcomeHandler = Handler(Looper.getMainLooper())
  private var welcomePlayer: MediaPlayer? = null

  private val welcomePreferences by lazy { getSharedPreferences("welcome", MODE_PRIVATE) }
  private fun canPlayWelcome(): Boolean {
    val lastPlayed = welcomePreferences.getLong("lastPlayedAt", 0L)
    return lastPlayed == 0L || System.currentTimeMillis() - lastPlayed >= 60 * 60 * 1000L
  }

  private val playWelcome = Runnable {
    if (welcomePlayer == null && canPlayWelcome()) {
      try {
        val player = MediaPlayer.create(this, R.raw.welcome_hi)
        welcomePlayer = player
        player?.setOnCompletionListener { stopWelcome() }
        player?.setOnErrorListener { _, _, _ ->
          stopWelcome()
          true
        }
        if (player != null) {
          player.start()
          // Persist at playback start so interruptions and restarts cannot repeat it.
          welcomePreferences.edit().putLong("lastPlayedAt", System.currentTimeMillis()).apply()
        }
      } catch (_: Exception) {
        // Audio must never prevent the app from opening. Retry next launch.
        stopWelcome()
      }
    }
  }

  override fun onResume() {
    super.onResume()
    welcomeHandler.removeCallbacks(playWelcome)
    if (canPlayWelcome()) { welcomeHandler.postDelayed(playWelcome, 800) }
  }

  override fun onPause() {
    welcomeHandler.removeCallbacks(playWelcome)
    stopWelcome()
    super.onPause()
  }

  private fun stopWelcome() {
    welcomePlayer?.release()
    welcomePlayer = null
  }


  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "FeDairy"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
