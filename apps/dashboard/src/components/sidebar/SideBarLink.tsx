// SidebarLink.tsx
import { Link, useLocation } from "react-router-dom";
import { NavItem } from "../layout/types";
import { ICONS } from "./icons.ts";

interface SidebarLinkProps {
  item: NavItem;
  onClick?: () => void;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ item, onClick }) => {
  const { pathname } = useLocation();
  const isActive = pathname === item.to;
  const Icon = ICONS[item.label];

  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={[
        "flex items-center px-4 py-4 mb-2 text-sm transition-colors duration-200 ease-in-out rounded-tl-4xl rounded-bl-4xl",
        isActive
          ? "bg-primary text-white border-r-4 border-success font-medium"
          : "text-neutral hover:text-gray-900 hover:bg-gray-200",
      ].join(" ")}
    >
      {Icon && (
        <Icon
          className={`h-5 w-5 mr-3 fill-current ${
            isActive ? "text-white" : "text-neutral"
          }`}
        />
      )}
      <span>{item.label}</span>
    </Link>
  );
};
