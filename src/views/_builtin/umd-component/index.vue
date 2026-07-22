<script setup lang="ts">
  import { getCurrentInstance, computed, useAttrs } from 'vue';
  import { useRoute } from 'vue-router';
  import {
    umdLoadingCount,
    umdRegistryVersion,
  } from '@/utils/remoteComponentLoader';

  defineOptions({
    name: 'UmdComponentPage',
    inheritAttrs: false,
  });

  const props = defineProps<{
    componentName: string;
    componentTag?: string;
  }>();

  const attrs = useAttrs();
  const route = useRoute();

  function toCamelCase(key: string) {
    return key.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
  }

  function normalizeProps(source: Record<string, unknown>) {
    return Object.entries(source).reduce<Record<string, unknown>>((result, [key, value]) => {
      if (key === 'class' || key === 'style') return result;
      result[toCamelCase(key)] = value;
      return result;
    }, {});
  }

  function stripWrappedQuotes(value: string) {
    if (value.length < 2) return value;
    const wrappers = [`'`, `"`, '`'];
    for (const wrapper of wrappers) {
      if (value.startsWith(wrapper) && value.endsWith(wrapper)) {
        return value.slice(1, -1);
      }
    }
    return value;
  }

  function toJsonQuotedString(value: string) {
    return JSON.stringify(stripWrappedQuotes(value));
  }

  function normalizeStructuredLiteral(value: string) {
    let normalized = value.trim();

    normalized = normalized.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, fullMatch =>
      toJsonQuotedString(fullMatch)
    );
    normalized = normalized.replace(/`([^`\\]*(\\.[^`\\]*)*)`/g, fullMatch =>
      toJsonQuotedString(fullMatch)
    );
    normalized = normalized.replace(/([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g, '$1"$2"$3');

    return normalized;
  }

  function parseStructuredValue(value: string): unknown {
    try {
      return JSON.parse(normalizeStructuredLiteral(value));
    } catch {
      return value;
    }
  }

  function parseBoundValue(value: string): unknown {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (
      (trimmed.startsWith(`'`) && trimmed.endsWith(`'`)) ||
      (trimmed.startsWith(`"`) && trimmed.endsWith(`"`)) ||
      (trimmed.startsWith('`') && trimmed.endsWith('`'))
    ) {
      return stripWrappedQuotes(trimmed);
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return undefined;
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      return parseStructuredValue(trimmed);
    }
    return trimmed;
  }

  function parseComponentTag(tag: string) {
    const normalizedTag = tag.trim();
    const match = normalizedTag.match(/^<([a-zA-Z0-9-]+)\s*([\s\S]*?)\/?>$/);
    if (!match) return null;

    const [, tagName, attrSource] = match;
    const attrs: Record<string, unknown> = {};
    const attrRegex =
      /([:@]?[a-zA-Z_][\w:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s"'`=<>]+)))?/g;

    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(attrSource)) !== null) {
      const rawName = attrMatch[1];
      const rawValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? attrMatch[5];
      const isBound = rawName.startsWith(':') || rawName.startsWith('v-bind:');
      const normalizedName = rawName.replace(/^:|^v-bind:/, '');

      attrs[toCamelCase(normalizedName)] =
        rawValue === undefined ? true : isBound ? parseBoundValue(rawValue) : rawValue;
    }

    return {
      componentName: tagName,
      props: attrs,
    };
  }

  const parsedComponentTag = computed(() =>
    parseComponentTag(props.componentTag || props.componentName)
  );

  const resolvedComponentName = computed(
    () => parsedComponentTag.value?.componentName || props.componentName
  );

  const componentProps = computed(() => ({
    ...(parsedComponentTag.value?.props ?? {}),
    ...normalizeProps(route.query as Record<string, unknown>),
    ...normalizeProps(attrs as Record<string, unknown>),
  }));

  // appContext.components 本身不是响应式对象，通过注册版本信号重新检查。
  const instance = getCurrentInstance();
  const isRegistered = computed(() => {
    void umdRegistryVersion.value;
    if (!resolvedComponentName.value || !instance) return false;
    return Object.prototype.hasOwnProperty.call(
      instance.appContext.components,
      resolvedComponentName.value
    );
  });

  const isLoading = computed(() => !isRegistered.value && umdLoadingCount.value > 0);
</script>

<template>
  <div class="umd-component-page">
    <!-- 渲染已注册的 UMD 组件标签，用 wrapper 隔离布局样式，避免污染 UMD 组件的根元素 -->
    <div
      v-if="isRegistered"
      class="umd-component-content"
    >
      <component
        :is="resolvedComponentName"
        v-bind="componentProps"
      />
    </div>

    <!-- UMD 脚本仍在下载或执行时显示加载态，注册完成后会自动渲染组件。 -->
    <div
      v-else-if="isLoading"
      class="umd-loading"
    >
      <i class="fas fa-spinner fa-spin" />
      <p>组件 "{{ resolvedComponentName }}" 加载中...</p>
    </div>

    <!-- 所有 UMD 加载均结束后仍未注册，才显示错误状态。 -->
    <div
      v-else
      class="umd-not-found"
    >
      <i class="fas fa-puzzle-piece" />
      <p>组件 "{{ resolvedComponentName }}" 未注册</p>
      <p class="umd-hint">请检查 UMD 文件是否已正确加载</p>
    </div>
  </div>
</template>

<style scoped>
  .umd-component-page {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    pointer-events: auto;
  }

  .umd-component-content {
    width: 100%;
    height: 100%;
    display: block;
  }

  .umd-loading,
  .umd-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 14px;
    gap: 10px;
  }

  .umd-loading i,
  .umd-not-found i {
    font-size: 36px;
    opacity: 0.5;
  }

  .umd-hint {
    font-size: 12px;
    opacity: 0.7;
  }
</style>
