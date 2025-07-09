import * as React from "react";
import { cn } from "../lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "md",
          "h-8 w-8": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, text = "Chargement...", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center space-x-2 p-4",
        className
      )}
      {...props}
    >
      <LoadingSpinner />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
);
Loading.displayName = "Loading";

export { Loading, LoadingSpinner };
