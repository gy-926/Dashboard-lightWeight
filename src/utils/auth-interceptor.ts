import { triggerReLogin } from '@/composables/useReLogin';
import { getCurrentUser, isNestApiRequest } from '@/api/nest-client';

const AUTH_ENDPOINTS = ['/auth/kivii.json'];

function shouldPromptReLogin(url: string): boolean {
  // Nest 请求由 apiRequest 负责静默刷新；初始化时 refresh 返回 401 也属于正常未登录状态。
  if (isNestApiRequest(url) || AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint))) return false;
  if (!getCurrentUser()) return false;
  return !['/login', '/SpringLogin', '/update-password'].includes(window.location.pathname);
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
        if (this._interceptUrl && shouldPromptReLogin(this._interceptUrl)) {
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
      if (shouldPromptReLogin(url)) {
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
