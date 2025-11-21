import { cn } from "@/utils/cn";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer - A responsive container component that ensures consistent width
 * and spacing across all pages, matching the Navbar and Footer container styles.
 *
 * Features:
 * - Max width matching Footer (max-w-7xl)
 * - Responsive padding (px-4 sm:px-6 lg:px-8)
 * - Centered content (mx-auto)
 * - Optional custom className for additional styling
 */
function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}>
      {children}
    </div>
  );
}

export default PageContainer;

