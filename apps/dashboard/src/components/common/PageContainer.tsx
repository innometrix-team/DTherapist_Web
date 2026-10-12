import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

/**
 * Standard width preset container across all DTherapist pages.
 * Default max-width is max-w-screen-2xl (1536px) with responsive horizontal and vertical padding.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = "",
  maxWidth = "max-w-screen-2xl",
}) => {
  return (
    <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
