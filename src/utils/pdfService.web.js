import { Alert } from 'react-native';
import { generatePdfBase64 } from './purePdfBuilder';
import { buildBillTextReceipt } from './billTextReceipt';

const PDF_TYPE = 'application/pdf';

const getFilename = billData => {
  const partyRole = billData.partyRole || (billData.seller ? 'seller' : 'customer');
  const prefix = partyRole === 'seller' ? 'Purchase' : 'Sale';
  const billNumber = String(billData.billNumber || 'Bill')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_');
  return `${prefix}_${billNumber}.pdf`;
};

const createPdf = billData => {
  const base64 = generatePdfBase64(billData);
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const filename = getFilename(billData);
  const blob = new Blob([bytes], { type: PDF_TYPE });
  const file = new File([blob], filename, { type: PDF_TYPE });
  const url = URL.createObjectURL(blob);
  // Keep the object URL alive while Safari's PDF viewer or share sheet uses it.
  window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
  return {
    base64,
    dataUri: `data:${PDF_TYPE};base64,${base64}`,
    filename,
    blob,
    file,
    url,
  };
};

const isIOSBrowser = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const openInSafariViewer = document => {
  const preview = window.open(document.url, '_blank');
  if (preview) return true;
  // If Safari blocks the first tab (for example, after a share-sheet error),
  // give the user a fresh, explicit tap that Safari treats as an activation.
  Alert.alert(
    'Open bill PDF',
    'Safari blocked the PDF tab. Tap Open PDF, then use Share to save or send it.',
    [{ text: 'Open PDF', onPress: () => window.open(document.url, '_blank') }, { text: 'Cancel' }],
  );
  return false;
};

const openOrDownload = document => {
  if (isIOSBrowser()) {
    // Safari's PDF viewer offers Print and Share > Save to Files. This is more
    // reliable on iPhone than the anchor `download` attribute for a Blob URL.
    const opened = openInSafariViewer(document);
    return {
      success: true,
      method: opened ? 'safari-preview' : 'safari-preview-prompt',
    };
  }

  const link = window.document.createElement('a');
  link.href = document.url;
  link.download = document.filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  return { success: true, method: 'download' };
};

const explainSafariFallback = method => {
  if (method === 'safari-preview') {
    Alert.alert(
      'PDF ready',
      "The bill opened in Safari. Use the Share button there to send it or choose Save to Files.",
    );
  } else {
    Alert.alert(
      'PDF ready',
      'The bill was downloaded. Attach the PDF from Files or Downloads to share it.',
    );
  }
};

export const printOrDownloadBill = async billData => {
  try {
    const document = createPdf(billData);
    const result = openOrDownload(document);
    if (result.method === 'safari-preview') explainSafariFallback(result.method);
    return result;
  } catch (error) {
    Alert.alert('Could not create PDF', error?.message || 'Please try again.');
    return { success: false, error };
  }
};

export const shareBillSummary = async billData => {
  let document;
  try {
    document = createPdf(billData);
  } catch (error) {
    Alert.alert('Could not create PDF', error?.message || 'Please try again.');
    return { success: false, error };
  }

  const shareData = {
    files: [document.file],
    title: document.filename.replace(/\.pdf$/i, ''),
    text: buildBillTextReceipt(billData),
  };

  if (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: shareData.files })
  ) {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'share-sheet' };
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      Alert.alert(
        'Could not share PDF',
        isIOSBrowser()
          ? 'Open the PDF in Safari, then use its Share menu to save or send the bill.'
          : 'Download the PDF and attach it from your Downloads folder.',
        [
          {
            text: isIOSBrowser() ? 'Open PDF' : 'Download PDF',
            onPress: () => {
              const fallback = openOrDownload(document);
              explainSafariFallback(fallback.method);
            },
          },
          { text: 'OK' },
        ],
      );
      return { success: false, error, method: 'user-activated-fallback' };
    }
  }

  const fallback = openOrDownload(document);
  explainSafariFallback(fallback.method);
  return { success: true, method: `${fallback.method}-share-fallback` };
};

export const createPdfFile = async billData => {
  try {
    const document = createPdf(billData);
    return {
      success: true,
      base64: document.base64,
      dataUri: document.dataUri,
      blob: document.blob,
      file: document.file,
      filename: document.filename,
    };
  } catch (error) {
    return { success: false, error };
  }
};

export default { printOrDownloadBill, shareBillSummary, createPdfFile };
