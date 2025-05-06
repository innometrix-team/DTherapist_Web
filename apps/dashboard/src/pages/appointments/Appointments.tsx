import { useState } from 'react';

// Import types
import { TabType } from '../../components/appointment/types';

// Import constants
import { UPCOMING_SESSIONS, PASSED_SESSIONS } from '../../components/appointment/constants';

// Import components
import TabNavigation from '../../components/appointment/TabNavigation';
import TableHeader from '../../components/appointment/TableHeader';
import SessionTable from '../../components/appointment/SessionTable';


const Appointments: React.FC = () => {
  // State for active tab (Upcoming or Passed)
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  // Function to handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div 
        className="w-full h-32 rounded-lg mb-6 flex items-center justify-center px-8 bg-black/50 bg-no-repeat bg-center bg-cover"
        style={{
          backgroundImage: 'url(https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637)'
        }}
      >
        <h1 className="text-3xl font-semibold text-white">My Sessions</h1>
      </div>

      {/* Tab Navigation */}
      <div className="relative">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Sessions Table */}
      <div className="mt-4">
        {/* Table Header */}
        <TableHeader />

        {/* Table Content */}
        {activeTab === 'upcoming' && (
          <SessionTable sessions={UPCOMING_SESSIONS} type="upcoming" />
        )}
        
        {activeTab === 'passed' && (
          <SessionTable sessions={PASSED_SESSIONS} type="passed" />
        )}
      </div>
    </div>
  );
};

export default Appointments;
