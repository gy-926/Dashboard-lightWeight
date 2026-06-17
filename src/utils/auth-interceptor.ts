import { triggerReLogin } from '@/composables/useReLogin';

const AUTH_ENDPOINTS = ['/auth/kivii.json'];

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function setupXHRInterceptor() {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _interceptUrl?: string },
    method: string,
    url: string | URL,
    ...rest: any[]
  ) {
    this._interceptUrl = String(url);
    return (originalOpen as any).call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { _interceptUrl?: string },
    ...args: any[]
  ) {
    this.addEventListener('readystatechange', () => {
      if (this.readyState === 4 && this.status === 401) {
        if (this._interceptUrl && !isAuthEndpoint(this._interceptUrl)) {
          triggerReLogin();
        }
      }
    });
    return (originalSend as any).apply(this, args);
  };
}

function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const response = await originalFetch.apply(window, args);
    if (response.status === 401) {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      if (!isAuthEndpoint(url)) {
        triggerReLogin();
      }
    }
    return response;
  };
}

export function setupAuthInterceptor() {
  setupXHRInterceptor();
  setupFetchInterceptor();
}
