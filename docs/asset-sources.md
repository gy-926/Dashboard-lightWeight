# 分发资源来源记录

此表记录仓库当前附带的演示 UMD 资源，便于维护和后续补全。信息来自产物内的 manifest 或元数据；作者字段不等同于授权证明。未找到明确来源或许可的部分标为待确认，不推断其采用项目的 MIT 许可。

| 仓库路径 | 产物中的标识 / 作者信息 | 来源、构建版本与许可状态 |
| --- | --- | --- |
| `public/umd-showcase/kivii-runtime-showcase.umd.js` | `VueComponent`；包含 `GavinYin` 作者字段 | 源仓库与构建提交待确认；独立许可声明待确认 |
| `public/umd/kivii-component-crmUmd.umd.js` | `VueComponent`；包含 `Kivii & Wemt Team` 等作者字段 | 源仓库与构建提交待确认；独立许可声明待确认 |
| `public/umd/kivii-dashboard-umd-standards.js` | `SmartStandardLibrary`；版本字段 `1.0.0`；包含 `zmy` 作者字段 | 源仓库与构建提交待确认；独立许可声明待确认 |
| `public/codes/kivii-component-demo-library.umd.js` | `VueComponent`；包含 `Kivii & Wemt Team` 等作者字段 | 历史示例；源仓库、构建提交和独立许可声明待确认 |

产物中的组件可能各自带有版本号，因此不能将任意组件版本当成整个构建包的版本。

npm 依赖的精确版本由根目录 `pnpm-lock.yaml` 和 `server/package-lock.json` 记录；相关许可证和版权声明以各依赖分发内容为准。

维护者确认资源来源后，请补充源仓库地址、tag 或 commit、构建方式和许可文本位置。新增或替换资源时同步更新此表，不要删除产物原有的版权与许可声明。
