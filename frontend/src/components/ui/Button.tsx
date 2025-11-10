import * as React from "react";

const combineClasses = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

const getButtonStyles = ({
  variant = "default",
  size = "default",
  className = "",
}: {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    default: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
    destructive:
      "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 hover:border-red-500/50",
    outline:
      "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50",
    secondary: "bg-gray-800 text-white shadow-sm hover:bg-gray-700",
    ghost: "text-gray-700 hover:bg-gray-100",
    link: "text-blue-600 underline-offset-4 hover:underline",
  };

  const sizeStyles = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md gap-1.5 px-3",
    lg: "h-10 rounded-md px-6",
    icon: "size-9",
  };

  return combineClasses(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={getButtonStyles({ variant, size, className })}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
export { getButtonStyles as ButtonVariants };
