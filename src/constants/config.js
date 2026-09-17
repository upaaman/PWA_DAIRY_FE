/**
 * App-wide constants.
 *
 * NOTE: Update API_BASE_URL to match your Spring Boot backend.
 * The backend (see AnimalController, DashboardController, etc.) does NOT
 * use an "/api" prefix — controllers are mapped directly at paths like
 * "/animal", "/dashboard", "/milkProduction". Server port is set via
 * server.port in application.properties (currently 8085).
 *
 * On Android, "localhost"/"127.0.0.1" refers to the device/emulator
 * itself, NEVER your development machine — you must use one of:
 *   - "10.0.2.2"        -> special alias that ONLY works inside the
 *                          Android Studio emulator (routes to host loopback)
 *   - your machine's LAN IP -> works on a REAL physical phone, as long as
 *                          it's on the same Wi-Fi network as this machine
 *                          (the emulator's virtual network usually can't
 *                          reach it, which is why it fails there)
 *
 * Flip TARGET below depending on what you're currently testing against.
 * If your machine's Wi-Fi IP changes, update LAN_IP.
 */
import { Platform } from 'react-native';

// 'EMULATOR' | 'PHYSICAL_DEVICE'
const TARGET = 'EMULATOR';
const LAN_IP = '192.168.29.194';

const ANDROID_URL =
  TARGET === 'PHYSICAL_DEVICE'
    ? `http://${LAN_IP}:8085`
    : 'http://10.0.2.2:8085';

export const API_BASE_URL = Platform.select({
  android: ANDROID_URL,
  ios: 'http://localhost:8085',
  default: 'http://localhost:8085',
});
