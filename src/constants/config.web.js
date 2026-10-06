const configured = import.meta.env.VITE_API_BASE_URL?.trim();
// Dev proxy is convenient locally; production defaults to the existing HTTPS API.
export const API_BASE_URL = (
  configured ||
  (import.meta.env.DEV ? '/api' : 'https://dairy-be-t8gm.onrender.com')
).replace(/\/$/, '');
if (!/^(https?:\/\/|\/[^/])/.test(API_BASE_URL)) {
  throw new Error(
    'VITE_API_BASE_URL must be an HTTP(S) URL or a same-origin path.',
  );
}
