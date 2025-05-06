
const TableHeader: React.FC = () => {
    return (
      <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-medium text-gray-700 rounded-lg shadow-md">
        <div>Names</div>
        <div>Date</div>
        <div>Time</div>
        <div className="flex justify-between">
          <span>Type</span>
          <span>Action</span>
        </div>
      </div>
    );
  };
  
  export default TableHeader;