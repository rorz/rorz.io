import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "./controls.tsx";

const Drawer = ({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) => {
  const region = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const element = region.current;
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        close.current();
      }
    };
    element?.focus();
    element?.addEventListener("keydown", handleEscape);
    return () => {
      element?.removeEventListener("keydown", handleEscape);
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);
  return (
    <aside
      aria-label={title}
      className="fixed inset-y-0 right-0 z-40 flex w-80 max-w-full flex-col border-l-2 border-black bg-white text-black"
      ref={region}
      tabIndex={-1}
    >
      <div className="flex items-center justify-between border-b border-black bg-black px-3 py-2 text-white">
        <h2 className="font-mono text-sm">{title}</h2>
        <Button onClick={onClose}>Close</Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
};

export { Drawer };
