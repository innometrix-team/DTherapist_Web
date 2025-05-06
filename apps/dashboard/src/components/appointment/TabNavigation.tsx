// src/components/TabNavigation.tsx
import { TabType } from './types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="grid grid-cols-2 border-b">
      <button
        className={`py-4 font-medium relative flex justify-center items-center ${
          activeTab === 'upcoming'
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onTabChange('upcoming')}
      >
        <span className="relative z-10">Upcoming Sessions</span>
        {activeTab === 'upcoming' && (
          <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>
        )}
      </button>
      <button
        className={`py-4 font-medium relative flex justify-center items-center ${
          activeTab === 'passed'
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onTabChange('passed')}
      >
        <span className="relative z-10">Passed Sessions</span>
        {activeTab === 'passed' && (
          <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>
        )}
      </button>
      <div className="absolute left-1/2 h-10 w-px bg-gray-200 top-1/2 transform -translate-y-1/2"></div>
    </div>
  );
};

export default TabNavigation;