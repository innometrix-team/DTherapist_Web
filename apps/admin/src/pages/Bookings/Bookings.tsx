import React from 'react'
import AdminBookingsTable from '../../components/booking/AdminBookingsTable'


const Bookings: React.FC = () => {
  return (
    <>
        <div className="space-y-6 p-4">
            <AdminBookingsTable />
        </div>
    </>
  )
}

export default Bookings