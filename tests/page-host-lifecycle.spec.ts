import { describe, expect, it, vi } from 'vitest';
import { createPageHostLifecycleController } from '@/runtime/page-host/lifecycle';
import type { PageDescriptor } from '@/runtime/page-host/types';

const descriptor: PageDescriptor = {
  tabKey: 'form',
  path: '/root/form',
  type: 'vue',
  url: '/remote/form.vue',
  kvid: 'form-kvid',
};

function createController(initiallyActive = true) {
  return createPageHostLifecycleController(
    { instanceKey: 'page-form', descriptor },
    initiallyActive
  );
}

describe('PageHost optional lifecycle context', () => {
  it('emits the initial state after descendants have registered callbacks', () => {
    const controller = createController(true);
    const onActivate = vi.fn();
    controller.context.onActivate(onActivate);

    controller.mount();

    expect(onActivate).toHaveBeenCalledOnce();
    expect(onActivate).toHaveBeenCalledWith({
      instanceKey: 'page-form',
      descriptor,
    });
  });

  it('emits only real active state transitions', () => {
    const controller = createController(true);
    const onActivate = vi.fn();
    const onDeactivate = vi.fn();
    controller.context.onActivate(onActivate);
    controller.context.onDeactivate(onDeactivate);
    controller.mount();

    controller.setActive(true);
    controller.setActive(false);
    controller.setActive(false);
    controller.setActive(true);

    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onDeactivate).toHaveBeenCalledOnce();
    expect(controller.context.active.value).toBe(true);
  });

  it('immediately reports current state to an asynchronously mounted remote child', () => {
    const controller = createController(true);
    const onActivate = vi.fn();
    controller.mount();

    controller.context.onActivate(onActivate);

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('reports a destroy reason once and ignores later transitions', () => {
    const controller = createController(true);
    const onDestroy = vi.fn();
    const onDeactivate = vi.fn();
    controller.context.onDestroy(onDestroy);
    controller.context.onDeactivate(onDeactivate);
    controller.mount();

    controller.destroy('logout');
    controller.destroy('close');
    controller.setActive(false);

    expect(onDestroy).toHaveBeenCalledOnce();
    expect(onDestroy).toHaveBeenCalledWith('logout', {
      instanceKey: 'page-form',
      descriptor,
    });
    expect(onDeactivate).not.toHaveBeenCalled();
  });

  it.each(['close', 'refresh', 'logout', 'lru', 'replace'] as const)(
    'preserves the %s destroy reason for the hosted page',
    reason => {
      const controller = createController(true);
      const onDestroy = vi.fn();
      controller.context.onDestroy(onDestroy);
      controller.mount();

      controller.destroy(reason);

      expect(onDestroy).toHaveBeenCalledWith(reason, expect.objectContaining({
        instanceKey: 'page-form',
      }));
    }
  );

  it('allows a page to unsubscribe from a lifecycle event', () => {
    const controller = createController(false);
    const onActivate = vi.fn();
    const unsubscribe = controller.context.onActivate(onActivate);
    controller.mount();
    unsubscribe();

    controller.setActive(true);

    expect(onActivate).not.toHaveBeenCalled();
  });
});
