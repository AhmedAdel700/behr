"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type ReactElement, type ReactNode, type RefObject } from "react";
import { GenieModalShell } from "@/components/shared/GenieModalShell";
import { ModalBackdrop } from "@/components/shared/ModalBackdrop";
import { useLargeScreen } from "@/lib/useLargeScreen";
import { cn } from "@/lib/utils";

const MAC_EASE = [0.16, 1, 0.3, 1] as const;

const shellVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
} as const;

const backdropMotion = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.28, ease: MAC_EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.22, ease: MAC_EASE },
  },
} as const;

const panelMotion = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: MAC_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 6,
    transition: { duration: 0.22, ease: MAC_EASE },
  },
} as const;

const backdropClassName =
  "h-auto min-h-0 w-auto min-w-0 cursor-pointer rounded-none border-0 bg-ink/50 p-0 shadow-none hover:bg-ink/50 active:translate-y-0 focus-visible:ring-0";

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  backdropAriaLabel: string;
  backdropDisabled?: boolean;
  /** When set, uses the genie open/close animation from this element on lg+ screens. */
  triggerRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  panelClassName?: string;
  layout?: "scroll" | "center";
  role?: "dialog" | "alertdialog";
  ariaModal?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

interface ModalPanelProps {
  animated: boolean;
  className: string;
  role?: "dialog" | "alertdialog";
  ariaModal?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  children: ReactNode;
}

function ModalPanel({
  animated,
  className,
  role,
  ariaModal,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
}: ModalPanelProps): ReactElement {
  const panelProps = {
    role,
    "aria-modal": ariaModal,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
  };

  if (!animated) {
    return (
      <div className={className} {...panelProps}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={panelMotion}
      {...panelProps}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedModalContentProps {
  layout: "scroll" | "center";
  backdropAriaLabel: string;
  backdropDisabled: boolean;
  onClose: () => void;
  panelClassName: string;
  role?: "dialog" | "alertdialog";
  ariaModal?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  children: ReactNode;
}

function AnimatedModalContent({
  layout,
  backdropAriaLabel,
  backdropDisabled,
  onClose,
  panelClassName,
  role,
  ariaModal,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
}: AnimatedModalContentProps): ReactElement {
  const backdropPosition = layout === "center" ? "absolute" : "fixed";

  const panel = (
    <ModalPanel
      animated
      className={panelClassName}
      role={role}
      ariaModal={ariaModal}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
    >
      {children}
    </ModalPanel>
  );

  if (layout === "center") {
    return (
      <motion.div
        key="modal-shell"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
        variants={shellVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.button
          type="button"
          aria-label={backdropAriaLabel}
          disabled={backdropDisabled}
          onClick={onClose}
          className={cn(
            backdropPosition === "fixed" ? "fixed inset-0" : "absolute inset-0",
            backdropClassName
          )}
          variants={backdropMotion}
        />
        {panel}
      </motion.div>
    );
  }

  return (
    <motion.div
      key="modal-shell"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      variants={shellVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.button
        type="button"
        aria-label={backdropAriaLabel}
        disabled={backdropDisabled}
        onClick={onClose}
        className={cn("fixed inset-0", backdropClassName)}
        variants={backdropMotion}
      />
      <div className="flex min-h-full items-center justify-center p-4">{panel}</div>
    </motion.div>
  );
}

function StaticModalContent({
  layout,
  backdropAriaLabel,
  backdropDisabled,
  onClose,
  panelClassName,
  role,
  ariaModal,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
}: AnimatedModalContentProps): ReactElement {
  const panel = (
    <ModalPanel
      animated={false}
      className={panelClassName}
      role={role}
      ariaModal={ariaModal}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedBy={ariaDescribedBy}
    >
      {children}
    </ModalPanel>
  );

  if (layout === "center") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
      >
        <ModalBackdrop
          ariaLabel={backdropAriaLabel}
          onClick={onClose}
          disabled={backdropDisabled}
          position="absolute"
        />
        {panel}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <ModalBackdrop
        ariaLabel={backdropAriaLabel}
        onClick={onClose}
        disabled={backdropDisabled}
      />
      <div className="flex min-h-full items-center justify-center p-4">{panel}</div>
    </div>
  );
}

export function ModalShell({
  open,
  onClose,
  backdropAriaLabel,
  backdropDisabled = false,
  triggerRef,
  children,
  panelClassName,
  layout = "scroll",
  role,
  ariaModal,
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalShellProps): ReactElement | null {
  const isLargeScreen = useLargeScreen();
  const reduceMotion = useReducedMotion();

  if (triggerRef) {
    return (
      <GenieModalShell
        open={open}
        onClose={onClose}
        triggerRef={triggerRef}
        backdropAriaLabel={backdropAriaLabel}
        backdropDisabled={backdropDisabled}
        panelClassName={panelClassName}
        role={role}
        ariaModal={ariaModal}
        ariaLabelledBy={ariaLabelledBy}
        ariaDescribedBy={ariaDescribedBy}
      >
        {children}
      </GenieModalShell>
    );
  }

  const shouldAnimate = isLargeScreen && reduceMotion !== true;

  const resolvedPanelClassName = cn(
    "relative z-10 w-full max-w-[38.5rem] rounded-2xl border border-border bg-surface p-4 shadow-md",
    panelClassName
  );

  const sharedProps: AnimatedModalContentProps = {
    layout,
    backdropAriaLabel,
    backdropDisabled,
    onClose,
    panelClassName: resolvedPanelClassName,
    role,
    ariaModal,
    ariaLabelledBy,
    ariaDescribedBy,
    children,
  };

  if (!shouldAnimate) {
    if (!open) return null;
    return <StaticModalContent {...sharedProps} />;
  }

  return (
    <AnimatePresence>
      {open ? <AnimatedModalContent {...sharedProps} /> : null}
    </AnimatePresence>
  );
}
