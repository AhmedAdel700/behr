import * as React from "react";

import { cn } from "@/lib/utils";
import { inputBaseClassName } from "@/components/ui/input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        inputBaseClassName,
        "field-sizing-content min-h-[9.375rem] h-auto resize-y py-2.5",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
