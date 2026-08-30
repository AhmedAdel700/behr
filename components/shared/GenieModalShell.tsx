"use client";

import { toCanvas } from "html-to-image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { ModalBackdrop } from "@/components/shared/ModalBackdrop";
import {
  GENIE_DURATION_MS,
  renderGenie,
  type GenieDirection,
  type GeniePoint,
} from "@/lib/genie/genieAnimation";
import { useLargeScreen } from "@/lib/useLargeScreen";
import { cn } from "@/lib/utils";

type GeniePhase =
  | "idle"
  | "prepare-open"
  | "opening"
  | "open"
  | "closing";

export interface GenieModalShellProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  backdropAriaLabel: string;
  backdropDisabled?: boolean;
  children: ReactNode;
  panelClassName?: string;
  role?: "dialog" | "alertdialog";
  ariaModal?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const GenieModalCloseContext = createContext<(() => void) | null>(null);

/** Defers unmount until the genie close animation finishes when inside GenieModalShell. */
export function useGenieModalClose(onClose: () => void): () => void {
  const requestClose = useContext(GenieModalCloseContext);
  return requestClose ?? onClose;
}

function getTriggerCenter(trigger: HTMLElement | null): GeniePoint {
  if (!trigger) {
    return { x: window.innerWidth / 2, y: window.innerHeight - 48 };
  }

  const rect = trigger.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getPanelOrigin(panel: HTMLElement | null): GeniePoint {
  if (!panel) {
    return {
      x: (window.innerWidth - 448) / 2,
      y: (window.innerHeight - 420) / 2,
    };
  }

  const rect = panel.getBoundingClientRect();
  return { x: rect.left, y: rect.top };
}

function hidePanelHard(panel: HTMLElement): void {
  panel.style.setProperty("opacity", "0", "important");
  panel.style.setProperty("visibility", "hidden", "important");
}

function hidePanelSoft(panel: HTMLElement): void {
  // Invisible on-screen but still laid out for measuring destination.
  panel.style.setProperty("opacity", "0", "important");
  panel.style.setProperty("visibility", "visible", "important");
}

function resetPanelPlacement(panel: HTMLElement): void {
  panel.style.removeProperty("position");
  panel.style.removeProperty("left");
  panel.style.removeProperty("top");
  panel.style.removeProperty("width");
  panel.style.removeProperty("height");
  panel.style.removeProperty("transform");
  panel.style.removeProperty("z-index");
  panel.style.removeProperty("margin");
  panel.style.removeProperty("pointer-events");
}

function isSnapshotUsable(canvas: HTMLCanvasElement): boolean {
  if (canvas.width < 2 || canvas.height < 2) return false;

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const sampleW = Math.min(canvas.width, 64);
  const sampleH = Math.min(canvas.height, 64);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

  let opaquePixels = 0;
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] > 12) {
      opaquePixels += 1;
      if (opaquePixels > 8) return true;
    }
  }

  return false;
}

function shouldEmbedImage(img: HTMLImageElement): boolean {
  if (!img.complete || img.naturalWidth === 0) {
    return false;
  }

  const src = img.currentSrc || img.src;
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
    return Boolean(src);
  }

  try {
    return new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function snapshotFilter(
  includeImages: boolean,
): (node: HTMLElement) => boolean {
  return (node: HTMLElement): boolean => {
    if (!(node instanceof HTMLImageElement)) {
      return true;
    }

    return includeImages && shouldEmbedImage(node);
  };
}

async function snapshotToCanvas(
  node: HTMLElement,
  width: number,
  height: number,
  style?: Partial<CSSStyleDeclaration>,
): Promise<HTMLCanvasElement> {
  const attempts: Array<{ includeImages: boolean }> = [
    { includeImages: true },
    { includeImages: false },
  ];

  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      const snapshot = await toCanvas(node, {
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: true,
        width,
        height,
        style,
        filter: snapshotFilter(attempt.includeImages),
        imagePlaceholder:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
        onImageErrorHandler: () => undefined,
      });

      if (isSnapshotUsable(snapshot)) {
        return snapshot;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Genie snapshot was blank");
}

/**
 * Snapshot the panel WITHOUT showing it on screen and WITHOUT a page cover.
 * The live node stays opacity:0; html-to-image's clone is forced visible via `style`.
 */
async function captureForOpen(
  panel: HTMLElement,
): Promise<{ snapshot: HTMLCanvasElement; destination: GeniePoint }> {
  hidePanelSoft(panel);
  resetPanelPlacement(panel);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const rect = panel.getBoundingClientRect();
  const destination: GeniePoint = { x: rect.left, y: rect.top };
  const width = Math.max(Math.round(rect.width), 1);
  const height = Math.max(Math.round(rect.height), 1);
  const visibleStyle: Partial<CSSStyleDeclaration> = {
    opacity: "1",
    visibility: "visible",
    transform: "none",
  };

  let snapshot: HTMLCanvasElement | null = null;

  try {
    snapshot = await snapshotToCanvas(panel, width, height, visibleStyle);
  } catch {
    snapshot = null;
  }

  // Fallback: off-screen DOM clone if the styled capture came back empty.
  if (!snapshot || !isSnapshotUsable(snapshot)) {
    const clone = panel.cloneNode(true) as HTMLElement;
    clone.removeAttribute("style");
    clone.setAttribute("aria-hidden", "true");
    clone.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      `width:${width}px`,
      `height:${height}px`,
      "opacity:1",
      "visibility:visible",
      "pointer-events:none",
      "margin:0",
      "transform:none",
      "z-index:-1",
    ].join(";");
    document.body.appendChild(clone);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    try {
      snapshot = await snapshotToCanvas(clone, width, height);
    } finally {
      clone.remove();
    }
  }

  hidePanelHard(panel);

  if (!snapshot || !isSnapshotUsable(snapshot)) {
    throw new Error("Genie open snapshot was blank");
  }

  return { snapshot, destination };
}

async function captureForClose(panel: HTMLElement): Promise<HTMLCanvasElement> {
  const rect = panel.getBoundingClientRect();
  return snapshotToCanvas(
    panel,
    Math.max(Math.round(rect.width), 1),
    Math.max(Math.round(rect.height), 1),
  );
}

export function GenieModalShell({
  open,
  onClose,
  triggerRef,
  backdropAriaLabel,
  backdropDisabled = false,
  children,
  panelClassName,
  role,
  ariaModal,
  ariaLabelledBy,
  ariaDescribedBy,
}: GenieModalShellProps): ReactElement | null {
  const isLargeScreen = useLargeScreen();
  const useGenie = isLargeScreen;

  const [phase, setPhase] = useState<GeniePhase>("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<HTMLCanvasElement | null>(null);
  const destinationRef = useRef<GeniePoint>({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const closingRef = useRef(false);
  const openRunRef = useRef(0);
  const capturingRef = useRef(false);
  const triggerPointRef = useRef<GeniePoint | null>(null);

  const resolvedPanelClassName = cn(
    "relative z-10 w-full max-w-[38.5rem] rounded-2xl border border-border bg-surface p-4 shadow-md",
    panelClassName,
  );

  const setupCanvas = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  const clearCanvas = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startAnimation = useCallback(
    (
      direction: GenieDirection,
      onDone: () => void,
      destinationOverride?: GeniePoint,
    ): void => {
      cancelAnimationFrame(rafRef.current);

      const snapshot = snapshotRef.current;
      if (!snapshot || snapshot.width < 2 || snapshot.height < 2) {
        onDone();
        return;
      }

      setupCanvas();

      const source =
        triggerPointRef.current ?? getTriggerCenter(triggerRef.current);
      const destination =
        destinationOverride ?? getPanelOrigin(panelRef.current);
      const panelW = snapshot.width;
      const panelH = snapshot.height;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        onDone();
        return;
      }

      canvas.style.zIndex = "70";

      renderGenie(
        ctx,
        snapshot,
        viewportW,
        viewportH,
        panelW,
        panelH,
        0,
        direction,
        source,
        destination,
      );

      let startTime: number | null = null;

      const frame = (timestamp: number): void => {
        if (startTime === null) startTime = timestamp;

        const rawT = Math.min((timestamp - startTime) / GENIE_DURATION_MS, 1);

        renderGenie(
          ctx,
          snapshot,
          viewportW,
          viewportH,
          panelW,
          panelH,
          rawT,
          direction,
          source,
          destination,
        );

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(frame);
          return;
        }

        onDone();
      };

      rafRef.current = requestAnimationFrame(frame);
    },
    [setupCanvas, triggerRef],
  );

  const startClose = useCallback(
    async (notifyParent: boolean): Promise<void> => {
      if (closingRef.current) return;
      closingRef.current = true;

      const panel = panelRef.current;
      if (!panel) {
        closingRef.current = false;
        setPhase("idle");
        if (notifyParent) {
          onClose();
        }
        return;
      }

      try {
        snapshotRef.current = await captureForClose(panel);
      } catch {
        closingRef.current = false;
        setPhase("idle");
        if (notifyParent) {
          onClose();
        }
        return;
      }

      setPhase("closing");

      startAnimation("minimize", () => {
        closingRef.current = false;
        setPhase("idle");
        clearCanvas();
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.style.zIndex = "60";
        }
        if (notifyParent) {
          onClose();
        }
      });
    },
    [clearCanvas, onClose, startAnimation],
  );

  const requestClose = useCallback((): void => {
    if (backdropDisabled) return;

    if (!useGenie) {
      onClose();
      return;
    }

    if (closingRef.current) return;

    if (phase === "open") {
      void startClose(true);
      return;
    }

    onClose();
  }, [backdropDisabled, onClose, phase, startClose, useGenie]);

  useEffect(() => {
    if (!useGenie || !open) return;
    if (phase !== "idle") return;
    triggerPointRef.current = getTriggerCenter(triggerRef.current);
    setPhase("prepare-open");
  }, [open, phase, useGenie, triggerRef]);

  useEffect(() => {
    if (open || !useGenie) return;
    if (phase !== "prepare-open" && phase !== "opening") return;

    openRunRef.current += 1;
    capturingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    clearCanvas();
    setPhase("idle");
  }, [open, phase, useGenie, clearCanvas]);

  useEffect(() => {
    if (!useGenie || open) return;
    if (phase !== "open") return;
    void startClose(false);
  }, [open, phase, startClose, useGenie]);

  useEffect(() => {
    if (phase !== "prepare-open") return;

    const runId = ++openRunRef.current;

    const prepareOpen = async (): Promise<void> => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      if (runId !== openRunRef.current) return;

      const panel = panelRef.current;
      if (!panel) {
        setPhase("open");
        return;
      }

      destinationRef.current = getPanelOrigin(panel);

      try {
        capturingRef.current = true;
        const { snapshot, destination } = await captureForOpen(panel);
        snapshotRef.current = snapshot;
        destinationRef.current = destination;
      } catch {
        capturingRef.current = false;
        setPhase("open");
        return;
      } finally {
        capturingRef.current = false;
      }

      if (runId !== openRunRef.current) return;

      startAnimation(
        "open",
        () => {
          flushSync(() => {
            setPhase("open");
          });
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.zIndex = "60";
          }
          requestAnimationFrame(() => {
            clearCanvas();
          });
        },
        destinationRef.current,
      );

      flushSync(() => {
        setPhase("opening");
      });
    };

    void prepareOpen();
  }, [phase, startAnimation, clearCanvas]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || capturingRef.current) return;

    if (phase === "open") {
      panel.style.removeProperty("opacity");
      panel.style.removeProperty("visibility");
      return;
    }

    if (phase === "prepare-open") {
      hidePanelSoft(panel);
      return;
    }

    if (phase === "opening" || phase === "closing") {
      hidePanelHard(panel);
    }
  }, [phase]);

  if (!useGenie) {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
        <ModalBackdrop
          ariaLabel={backdropAriaLabel}
          onClick={onClose}
          disabled={backdropDisabled}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className={resolvedPanelClassName}>{children}</div>
        </div>
      </div>
    );
  }

  const isVisible =
    open ||
    phase === "prepare-open" ||
    phase === "opening" ||
    phase === "open" ||
    phase === "closing";

  if (!isVisible && phase === "idle") return null;

  const panelInteractive = phase === "open";
  const genieOnCanvas = phase === "opening" || phase === "closing";

  return (
    <GenieModalCloseContext.Provider value={requestClose}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0"
        style={{
          width: "100%",
          height: "100%",
          zIndex: genieOnCanvas ? 70 : 60,
        }}
      />

      {genieOnCanvas ? (
        <div className="fixed inset-0 z-55" aria-hidden />
      ) : null}

      {isVisible ? (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
          {panelInteractive ? (
            <ModalBackdrop
              ariaLabel={backdropAriaLabel}
              onClick={requestClose}
              disabled={backdropDisabled}
            />
          ) : null}

          <div
            className={cn(
              "flex min-h-full items-center justify-center p-4",
              !panelInteractive && "pointer-events-none",
            )}
          >
            <div
              ref={panelRef}
              className={resolvedPanelClassName}
              role={panelInteractive ? role : undefined}
              aria-modal={panelInteractive ? ariaModal : undefined}
              aria-labelledby={panelInteractive ? ariaLabelledBy : undefined}
              aria-describedby={panelInteractive ? ariaDescribedBy : undefined}
              aria-hidden={!panelInteractive}
              style={{
                opacity: panelInteractive ? 1 : 0,
                pointerEvents: panelInteractive ? "auto" : "none",
              }}
            >
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </GenieModalCloseContext.Provider>
  );
}
