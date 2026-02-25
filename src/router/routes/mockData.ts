import type { MenuApiResponse } from './types'

// 401 未授权错误（供上层识别并跳转登录页）
export class UnauthorizedError extends Error {
  readonly status = 401
  constructor() {
    super('权限不足，请重新登录')
    this.name = 'UnauthorizedError'
  }
}

// 从接口获取菜单数据
export async function fetchMenuData(internalCode: string): Promise<MenuApiResponse> {
  const response = await fetch(
    `/Restful/Kivii.Basic.Entities.Menu/Show.json?RootInternalCode=${internalCode}`
  )

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error(`菜单数据加载失败: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
