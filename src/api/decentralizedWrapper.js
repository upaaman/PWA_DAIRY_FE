/**
 * decentralizedWrapper.js
 *
 * Single centralized HTTP layer for talking to the Spring Boot backend.
 * No authentication/JWT handling yet — Phase 1.
 *
 * Usage:
 *   import { get, post, put, patch, del } from '../api/decentralizedWrapper';
 *   const animals = await get('/animals');
 *   const created = await post('/animals', { name: 'Lakshmi' });
 */
import { API_BASE_URL } from '../constants/config';

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (networkError) {
    networkError.message = `Network request failed: ${networkError.message}`;
    throw networkError;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && data && data.message) ||
      (!isJson && typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const get = (endpoint, options = {}) =>
  request(endpoint, { ...options, method: 'GET' });

export const post = (endpoint, body, options = {}) =>
  request(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });

export const put = (endpoint, body, options = {}) =>
  request(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const patch = (endpoint, body, options = {}) =>
  request(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const del = (endpoint, options = {}) =>
  request(endpoint, { ...options, method: 'DELETE' });

export default { get, post, put, patch, del };
