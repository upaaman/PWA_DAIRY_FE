/**
 * App-wide constants.
 *
 * NOTE: Update API_BASE_URL to match your Spring Boot backend.
 * The backend (see AnimalController, DashboardController, etc.) does NOT
 * use an "/api" prefix — controllers are mapped directly at paths like
 * "/animal", "/dashboard", "/milkProduction". Server runs on the default
 * Spring Boot port 8080 (no server.port override in application.properties).
 *
 * - Android emulator:   http://10.0.2.2:8080
 * - iOS simulator:      http://localhost:8080
 * - Physical device:    http://<your-machine-lan-ip>:8080
 */
import { Platform } from 'react-native';

export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});
