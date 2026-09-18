import { forwardRef, useEffect, useRef, type CSSProperties, type ForwardedRef } from 'react';
import { SwipePagination as Core, type SwipePaginationOptions } from 'swipe-pagination';

export type { SwipePaginationOptions } from 'swipe-pagination';
export type SwipePaginationInstance = Core;

export interface SwipePaginationProps extends SwipePaginationOptions {
  className?: string;
  style?: CSSProperties;
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

export const SwipePagination = forwardRef<Core, SwipePaginationProps>(function SwipePagination(
  { className, style, ...options },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Core | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const instance = new Core(hostRef.current!, {
      ...optionsRef.current,
      onChange: (page, event) => optionsRef.current.onChange?.(page, event),
    });
    instanceRef.current = instance;
    assignRef(ref, instance);
    return () => {
      instance.destroy();
      instanceRef.current = null;
      assignRef(ref, null);
    };
  }, []);

  useEffect(() => {
    const { onChange: _onChange, ...rest } = options;
    instanceRef.current!.update(rest);
  });

  return <div ref={hostRef} className={className} style={style} />;
});
