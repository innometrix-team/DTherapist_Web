import React from 'react'
import AdminTransactionsTable from '../../components/Transaction/AdminTransactionsTable'


const Transaction: React.FC = () => {
  return (
    <>
    <div className="space-y-6 p-6">
      <AdminTransactionsTable />
    </div>
    </>
  )
}

export default Transaction