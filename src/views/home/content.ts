export const runtimeFlow = [
  {
    index: '01',
    title: '解析功能配置',
    subtitle: '定位模块来源',
    detail: '从功能配置解析 UMD 地址、导出名称和目标组件，无需重新构建宿主应用。',
    code: 'source_url → globalName → component',
    icon: 'fas fa-link',
  },
  {
    index: '02',
    title: '加载模块文件',
    subtitle: '运行时加载',
    detail: '按需加载远程脚本，共享主应用的 Vue 环境，并跟踪加载状态。',
    code: 'loadUMDComponent(sourceUrl)',
    icon: 'fas fa-bolt',
  },
  {
    index: '03',
    title: '读取组件清单',
    subtitle: '发现模块能力',
    detail: '读取模块清单、组件名称和描述信息，将远程模块转化为可管理的功能记录。',
    code: 'manifest.componentsDetailed',
    icon: 'fas fa-file-code',
  },
  {
    index: '04',
    title: '注册并管理页面',
    subtitle: '注册与生命周期',
    detail: '动态注册组件，并接入标签页、路由、缓存、刷新和销毁等统一生命周期。',
    code: 'app.component() → route → cache',
    icon: 'fas fa-cubes-stacked',
  },
];

export const adapters = [
  {
    name: 'Vue UMD',
    label: '核心能力',
    icon: 'fab fa-vuejs',
    tone: 'emerald',
    load: '运行时加载脚本',
    lifecycle: '动态注册 / 卸载',
    communication: '传入参数 / 接收事件 / 调用方法',
    description: '无需重新打包主应用，运行时发现并注册远程组件库。',
  },
  {
    name: 'Vue SFC',
    label: '动态适配',
    icon: 'fas fa-file-code',
    tone: 'blue',
    load: '加载远程源码',
    lifecycle: '编译 / 缓存',
    communication: '路由参数 / 页面上下文',
    description: '加载远程 Vue 单文件组件，并复用组件缓存与页面激活机制。',
  },
  {
    name: '内嵌页面 / 旧系统',
    label: '存量接入',
    icon: 'fas fa-window-restore',
    tone: 'amber',
    load: '内嵌页面 / 页面桥接',
    lifecycle: '挂载 / 显隐',
    communication: '页面桥接 / 事件通信',
    description: '通过内嵌页面承载旧系统，并保持页面间通信。',
  },
];

export const platformProofs = [
  {
    icon: 'fas fa-route',
    title: '动态菜单与路由',
    text: '后端配置实时生成路由树，模块接入后即可编排进工作空间。',
  },
  {
    icon: 'fas fa-table-columns',
    title: '多布局适配',
    text: '侧边、顶部、混合菜单共享同一份动态导航数据。',
  },
  {
    icon: 'fas fa-layer-group',
    title: '标签与缓存',
    text: '多页面标签、按需缓存、刷新和销毁形成完整运行周期。',
  },
  {
    icon: 'fas fa-user-shield',
    title: '权限链路',
    text: '用户、角色、功能与菜单可见性保持一致。',
  },
];

export const dashboardProfiles = [
  {
    code: 'umdDashboard',
    name: '运行管理工作台',
    description: '远程模块管理与运行状态',
    icon: 'fas fa-cubes-stacked',
    tone: 'blue',
    menus: ['运行总览', 'UMD 模块', '菜单配置', '系统功能'],
    widgets: ['运行状态', '模块清单', '操作记录'],
  },
  {
    code: 'operationsDashboard',
    name: '业务运营中心',
    description: '业务运营与任务协同',
    icon: 'fas fa-chart-line',
    tone: 'emerald',
    menus: ['运营总览', '客户中心', '订单任务', '数据报表'],
    widgets: ['业务指标', '待办事项', '订单动态'],
  },
  {
    code: 'analyticsDashboard',
    name: '数据分析工作台',
    description: '分析模型与数据洞察',
    icon: 'fas fa-chart-pie',
    tone: 'violet',
    menus: ['指标看板', '分析模型', '数据资产', '报告中心'],
    widgets: ['指标看板', '分析结果', '数据洞察'],
  },
];
