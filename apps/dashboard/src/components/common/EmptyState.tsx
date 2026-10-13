import React from "react";
import { Link } from "react-router-dom";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
  secondaryActionText?: string;
  onSecondaryActionClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
  secondaryActionText,
  onSecondaryActionClick,
  className = "",
}) => {
  return (
    <div
      className={`p-6 sm:p-10 text-center max-w-lg mx-auto my-4 ${className}`}
    >
      {/* Decorative Icon Circle without outline or popping */}
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-darkerb tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-neutral leading-relaxed max-w-md mx-auto mb-6">
        {description}
      </p>

      {/* Action Buttons */}
      {(actionText || secondaryActionText) && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {actionText && actionLink && (
            <Link
              to={actionLink}
              className="px-5 py-2.5 bg-primary hover:bg-darkerb text-white font-semibold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              {actionText}
            </Link>
          )}

          {actionText && !actionLink && onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="px-5 py-2.5 bg-primary hover:bg-darkerb text-white font-semibold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              {actionText}
            </button>
          )}

          {secondaryActionText && onSecondaryActionClick && (
            <button
              type="button"
              onClick={onSecondaryActionClick}
              className="px-4 py-2.5 border border-divider text-darkerb hover:bg-offwhite font-medium text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
