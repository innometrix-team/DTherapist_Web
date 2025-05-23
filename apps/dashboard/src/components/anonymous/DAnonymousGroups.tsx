import { useNavigate, useParams } from "react-router-dom";
import { useCallback } from "react";
import {
  DAnonymousGroupsProps,
  DUMMY_GROUPS,
  Group,
} from "../../pages/danonymous/types";

const DAnonymousGroups = ({ onGroupSelect }: DAnonymousGroupsProps) => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const handleGroupSelect = useCallback(
    (group: Group) => {
      onGroupSelect();
      navigate(`/anonymous/${group.id}`);
    },
    [navigate, onGroupSelect]
  );

  return (
    <div className="overflow-y-scroll pb-5 h-[calc(100%-130px)]  md:h-[calc(100%-80px)]">
      {DUMMY_GROUPS.map((group) => (
        <div
          key={group.id}
          onClick={() => handleGroupSelect(group)}
          className={`p-4 border-b-[0.5px] border-divider hover:bg-gray-50 cursor-pointer transition-colors ${
            groupId === group.id ? "bg-blue-50 border-l-4 border-l-primary" : ""
          } `}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg flex-shrink-0">
              <img
                src={group.avatar}
                className="h-full w-full object-fit-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 truncate text-sm">
                  {group.name}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-1 truncate font-medium">
                {group.category}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DAnonymousGroups;
