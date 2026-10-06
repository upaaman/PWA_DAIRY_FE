export * from 'react-native-web';
// RN Web's Alert is a no-op. Preserve native button callbacks with an accessible browser dialog.
export const Alert = {
  alert(title, message, buttons = [{ text: 'OK' }], options = {}) {
    const previousFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'web-dialog';
    const heading = document.createElement('h2');
    heading.id = `alert-${Math.random().toString(36).slice(2)}`;
    heading.textContent = title || 'Notice';
    dialog.setAttribute('aria-labelledby', heading.id);
    const body = document.createElement('p');
    body.textContent = message || '';
    const footer = document.createElement('footer');
    let completed = false;
    const close = callback => {
      if (completed) return;
      completed = true;
      dialog.close();
      dialog.remove();
      previousFocus?.focus?.();
      callback?.();
    };
    for (const item of buttons.length ? buttons : [{ text: 'OK' }]) {
      const button = document.createElement('button');
      button.textContent = item.text || 'OK';
      button.onclick = () => close(item.onPress);
      footer.append(button);
    }
    dialog.oncancel = event => {
      event.preventDefault();
      if (options.cancelable) close(options.onDismiss);
    };
    dialog.append(heading, body, footer);
    document.body.append(dialog);
    dialog.showModal();
  },
};
