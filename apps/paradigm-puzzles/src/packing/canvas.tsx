// biome-ignore-all lint/style/noMagicNumbers: viewport interaction and display limits.
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { Button } from "./controls.tsx";
import { type Drawing, drawScene, type Size, type Viewport } from "./draw.ts";
import type { Point } from "./model.ts";

type Drag = {
  start: Point;
  origin: Point;
  fanId: string | undefined;
  viewport: Viewport;
};
type CanvasProps = Omit<Drawing, "size" | "viewport"> & {
  moveFan: (id: string, point: Point) => void;
  selectFan: (id: string) => void;
};
const worldPoint = (point: Point, size: Size, viewport: Viewport): Point => ({
  x: viewport.x + (point.x - size.width / 2) / viewport.scale,
  y: viewport.y - (point.y - size.height / 2) / viewport.scale,
});
const PackingCanvas = (props: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | undefined>(undefined);
  const [size, setSize] = useState<Size>({
    height: 600,
    width: 800,
  });
  const [camera, setCamera] = useState<Viewport | undefined>(undefined);
  const viewport = camera ?? {
    scale: Math.min(size.width, size.height) / (Math.max(1.5, props.circle.radius) * 2 + 1.5),
    x: props.circle.x,
    y: props.circle.y,
  };
  const zoom = (factor: number) =>
    setCamera({
      ...viewport,
      scale: Math.max(12, Math.min(500, viewport.scale * factor)),
    });
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({
          height: entry.contentRect.height,
          width: entry.contentRect.width,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawScene(canvas, {
        ...props,
        size,
        viewport,
      });
    }
  }, [
    props,
    size,
    viewport,
  ]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const before = worldPoint(point, size, viewport);
      const scale = Math.max(12, Math.min(500, viewport.scale * Math.exp(-event.deltaY * 0.001)));
      const after = worldPoint(point, size, {
        ...viewport,
        scale,
      });
      setCamera({
        scale,
        x: viewport.x + before.x - after.x,
        y: viewport.y + before.y - after.y,
      });
    };
    canvas.addEventListener("wheel", wheel, {
      passive: false,
    });
    return () => canvas.removeEventListener("wheel", wheel);
  }, [
    size,
    viewport,
  ]);
  const pointerPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };
  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) {
      return;
    }
    const start = pointerPoint(event);
    const point = worldPoint(start, size, viewport);
    const selected = props.fans.find((item) => item.id === props.selected);
    const hub =
      selected && Math.hypot(point.x - selected.x, point.y - selected.y) < 12 / viewport.scale;
    const hit = props.shapes.toReversed().find((shape) => {
      const dx = point.x - shape.x;
      const dy = point.y - shape.y;
      return dx * dx + dy * dy <= 1 && dx * Math.cos(shape.theta) + dy * Math.sin(shape.theta) >= 0;
    });
    let fanId = hub ? selected.id : hit?.fanId;
    if (event.shiftKey) {
      fanId = undefined;
    }
    const fan = props.fans.find((item) => item.id === fanId);
    drag.current = {
      fanId,
      origin: fan ?? viewport,
      start,
      viewport,
    };
    setCamera(viewport);
    if (fanId) {
      props.selectFan(fanId);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const active = drag.current;
    if (!active) {
      return;
    }
    const point = pointerPoint(event);
    const dx = (point.x - active.start.x) / active.viewport.scale;
    const dy = -(point.y - active.start.y) / active.viewport.scale;
    if (active.fanId) {
      props.moveFan(active.fanId, {
        x: Number(Math.max(-20, Math.min(20, active.origin.x + dx)).toFixed(3)),
        y: Number(Math.max(-20, Math.min(20, active.origin.y + dy)).toFixed(3)),
      });
    } else {
      setCamera({
        ...active.viewport,
        x: active.origin.x - dx,
        y: active.origin.y - dy,
      });
    }
  };
  const zoomIn = () => zoom(1.2);
  const zoomOut = () => zoom(1 / 1.2);
  const fit = () => setCamera(undefined);
  const stopDrag = () => {
    drag.current = undefined;
  };
  const pointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    stopDrag();
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const keyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const actions: Record<string, () => void> = {
      "-": zoomOut,
      "+": zoomIn,
      "=": zoomIn,
      "0": fit,
      arrowdown: () =>
        setCamera({
          ...viewport,
          y: viewport.y - 0.25,
        }),
      arrowleft: () =>
        setCamera({
          ...viewport,
          x: viewport.x - 0.25,
        }),
      arrowright: () =>
        setCamera({
          ...viewport,
          x: viewport.x + 0.25,
        }),
      arrowup: () =>
        setCamera({
          ...viewport,
          y: viewport.y + 0.25,
        }),
    };
    const action = actions[event.key.toLowerCase()];
    if (action) {
      event.preventDefault();
      action();
    }
  };
  return (
    <section
      aria-label="Packing canvas"
      className="flex min-h-96 min-w-0 flex-1 flex-col lg:min-h-0"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black px-3 py-2 text-xs">
        <span className="font-mono">
          VIEW / XY <span className="ml-2 opacity-50">+Y ↑</span>
        </span>
        <div className="flex gap-1">
          <Button onClick={zoomOut} title="Zoom out">
            −
          </Button>
          <Button onClick={zoomIn} title="Zoom in">
            +
          </Button>
          <Button onClick={fit} title="Fit the enclosing circle">
            Fit
          </Button>
        </div>
      </div>
      <div className="relative min-h-96 flex-1 overflow-hidden lg:min-h-0" ref={containerRef}>
        <canvas
          aria-label="Semicircle arrangement. Drag a shape to move its fan; drag empty space to pan. Use plus and minus to zoom, arrow keys to pan, and zero to fit."
          className="absolute inset-0 size-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
          onKeyDown={keyDown}
          onLostPointerCapture={stopDrag}
          onPointerCancel={stopDrag}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          ref={canvasRef}
          role="img"
          tabIndex={0}
        />
      </div>
      <p className="shrink-0 border-t border-black px-3 py-2 text-xs">
        Drag shape: move fan · Empty space / Shift-drag: pan · Scroll: zoom · Hatching: overlap
      </p>
    </section>
  );
};

export { PackingCanvas };
