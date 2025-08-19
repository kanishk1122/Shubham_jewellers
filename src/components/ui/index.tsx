import React from "react";
import * as ReactDialog from "@radix-ui/react-dialog";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export const CardHeader: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  return (
    <div className="border-b p-4">
      <h2 className="text-lg font-semibold">{children}</h2>
    </div>
  );
};

export const CardTitle: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">{children}</h3>
    </div>
  );
};

interface CardContentProps {
  children?: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
}) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseClasses =
    "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary:
      "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-100",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600",
    success:
      "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
          error ? "border-red-300 dark:border-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[]; // optional — callers may pass children instead
  // convenience: callback that receives just the selected value
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  onValueChange,
  className = "",
  children,
  onChange,
  ...props
}) => {
  // unified change handler: call native onChange (if provided) and onValueChange (if provided)
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      if (typeof onChange === "function") {
        // forward the event to the original onChange handler
        (onChange as any)(e);
      }
    } catch {
      // ignore
    }
    if (typeof onValueChange === "function") {
      onValueChange(e.target.value);
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
          error ? "border-red-300" : ""
        } ${className}`}
        onChange={handleChange}
        {...(props as any)}
      >
        {/* If options prop provided, render them. Otherwise render children (native <option> nodes). */}
        {options && options.length > 0
          ? options.map((option) => (
              // avoid forcing text color on <option>; let browser render normally
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          error ? "border-red-300" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
}) => {
  return (
    <div
      className={`bg-white dark:bg-zinc-800 shadow-lg rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-zinc-500 bg-opacity-75"
          onClick={onClose}
        />

        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]}`}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  className = "",
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white border border-zinc-300">
        <thead className="bg-zinc-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-zinc-200">{children}</tbody>
      </table>
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "info",
  className = "",
}) => {
  const variantClasses = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// --- Dialog Components (shadcn/ui style) ---

export const Dialog = ReactDialog.Root;
export const DialogTrigger = ReactDialog.Trigger;
export const DialogPortal = ReactDialog.Portal;
export const DialogOverlay = (
  props: React.ComponentProps<typeof ReactDialog.Overlay>
) => (
  <ReactDialog.Overlay
    {...props}
    className={
      "fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in " +
      (props.className || "")
    }
  />
);
export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ReactDialog.Content> & { fullScreen?: boolean }
>(({ className = "", children, fullScreen = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <ReactDialog.Content
      ref={ref}
      className={
        "fixed z-50 grid gap-4 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-lg duration-200 " +
        (fullScreen
          ? "inset-0 h-[98vh] w-[99vw]  animate-in fade-in m-2 rounded-3xl"
          : "left-1/2 top-1/2 w-screen max-w-fit -translate-x-1/2 -translate-y-1/2 sm:rounded-lg") +
        " " +
        className
      }
      {...props}
    >
      {children}
    </ReactDialog.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className = "", ...props }, ref) => (
  <span
    ref={ref}
    className={
      "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 " +
      "[clip:rect(0,0,0,0)] " +
      className
    }
    {...props}
  />
));
VisuallyHidden.displayName = "VisuallyHidden";

export const DialogHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={
      "flex flex-col space-y-1.5 text-center sm:text-left " + className
    }
  >
    {children}
  </div>
);

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<typeof ReactDialog.Title>
>(({ className = "", children, ...props }, ref) => (
  <ReactDialog.Title
    ref={ref}
    className={
      "text-lg font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100 " +
      className
    }
    {...props}
  >
    {children}
  </ReactDialog.Title>
));
DialogTitle.displayName = "DialogTitle";

export const DialogFooter = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 " +
      className
    }
  >
    {children}
  </div>
);
