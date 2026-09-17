/**
 * Manual Jest mock for react-native-share.
 *
 * The real native module isn't registered in the Jest test environment
 * (no actual Android/iOS binary), so any test that transitively imports
 * pdfService.js needs this stub instead of hitting TurboModuleRegistry.
 */
const Share = {
  open: jest.fn(() => Promise.resolve({ success: true })),
  shareSingle: jest.fn(() => Promise.resolve({ success: true })),
  isPackageInstalled: jest.fn(() => Promise.resolve({ isInstalled: false })),
};

export default Share;
