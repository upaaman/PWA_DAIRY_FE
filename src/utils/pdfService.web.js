import { Alert } from 'react-native';
// Keep native sharing out of the initial browser bundle; milestone 6 adds browser file delivery.
const unavailable = async () => {
  Alert.alert(
    'PDF export',
    'PDF download and sharing will be available in a later web update.',
  );
  return { success: false };
};
export const printOrDownloadBill = unavailable;
export const shareBillSummary = unavailable;
export const createPdfFile = unavailable;
export default { printOrDownloadBill, shareBillSummary, createPdfFile };
