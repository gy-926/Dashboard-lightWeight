/**
 * Mock 模式控制
 *
 * 通过环境变量切换数据来源：
 *   VITE_API_MODE=mock  → 使用本地 mock 数据（默认，开发阶段）
 *   VITE_API_MODE=real  → 使用真实后端接口（接入后端时设置）
 *
 * 在 .env.local 中添加：
 *   VITE_API_MODE=real
 */
export const isMockMode = (import.meta.env.VITE_API_MODE ?? 'mock') === 'mock';
