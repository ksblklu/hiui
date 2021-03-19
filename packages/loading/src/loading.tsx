import React, { useState, useEffect, useImperativeHandle, useCallback, forwardRef, useRef } from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';
import debounce from 'lodash/debounce';
import CSSTransition from 'react-transition-group/CSSTransition';
import __DEV__ from './env';
import type { DebouncedFunc } from 'lodash';

const componentName = 'loading';
export const _prefix = 'hi4-loading';

export const Loading = forwardRef<null, LoadingProps>(
  (
    {
      prefixCls = _prefix,
      className,
      children,
      role = componentName,
      container,
      label,
      active = true,
      full = false,
      delay = -1,
      ...restProps
    },
    ref
  ) => {
    const [internalActive, setInternalActive] = useState(false);

    // Real trigger loading update
    const updateLoadingStatus = useCallback(() => {
      if (internalActive === active) return;
      setInternalActive(active);
    }, [internalActive, active]);

    const prevDebouncedUpdateRef = useRef<null | DebouncedFunc<typeof updateLoadingStatus>>(null);

    const cancelWaitingLoading = () => {
      prevDebouncedUpdateRef.current?.cancel();
    };

    const shouldDelay = active && delay >= 0;

    const debouncedLoadingUpdater = useCallback(() => {
      cancelWaitingLoading();

      if (shouldDelay) {
        const debouncedUpdateLoading = debounce(updateLoadingStatus, delay);
        prevDebouncedUpdateRef.current = debouncedUpdateLoading;

        debouncedUpdateLoading();
      } else {
        updateLoadingStatus();
        prevDebouncedUpdateRef.current = null;
      }
    }, [delay, updateLoadingStatus]);

    useEffect(() => {
      debouncedLoadingUpdater();

      return () => {
        cancelWaitingLoading();
      };
    }, [active]);

    // @ts-ignore
    useImperativeHandle(ref, () => ({
      // @ts-ignore
      local: ref?.current,
      $close: () => setInternalActive(false),
    }));

    const mountNode = container || (full ? document.body : '');

    const maskCls = cx(
      `${prefixCls}__mask`,
      children && `${prefixCls}__mask--withchildren`,
      full && `${prefixCls}__mask--full`
    );
    const iconCls = cx(`${prefixCls}__icon`);
    const labelCls = cx(`${prefixCls}__label`);

    const loadingComponent = (
      <CSSTransition classNames={`${prefixCls}__mask`} in={internalActive} unmountOnExit timeout={300}>
        <div ref={ref} role={role} className={maskCls} {...restProps}>
          <div className={cx(prefixCls, className)}>
            <div className={`${prefixCls}__icon-wrapper`}>
              <div className={iconCls} />
            </div>
            {label ? <span className={labelCls}>{label}</span> : null}
          </div>
        </div>
      </CSSTransition>
    );

    return (
      <Portal target={mountNode}>
        {children ? (
          // 可以测量 children margin，实现按内容位置偏移，排除 margin 影响
          // 暂时不考虑，如果有需要，完全可以把 margin 设置到加到父节点
          <div className={`${prefixCls}__wrapper`}>
            {children}
            {loadingComponent}
          </div>
        ) : (
          loadingComponent
        )}
      </Portal>
    );
  }
);

export interface LoadingProps {
  prefixCls?: string;
  role?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: React.ReactNode;
  active?: boolean;
  full?: boolean;
  container?: React.ReactNode;
  delay?: number;
}

if (__DEV__) {
  Loading.displayName = 'Loading';
}

export default Loading;

// TODO: 抽离封装
function Portal({ target, children }: any) {
  return target ? createPortal(children, target) : children;
}
