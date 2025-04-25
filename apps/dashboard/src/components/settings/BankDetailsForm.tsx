// /components/Settings/BankDetailsForm.tsx
import React, { useState } from "react";
import { BankDetails } from "../../types/settings.types";
import { bankOptions } from "../../constant/settings.constants";

const BankDetailsForm: React.FC = () => {
  const [form, setForm] = useState<BankDetails>({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Bank Details:", form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Bank Details</h2>

      <div className="flex items-center  gap-4">
        <label htmlFor="bankName" className="text-sm font-medium text-gray-700 w-40 shrink-0">
          Bank Name
        </label>
        <select
          name="bankName"
          id="bankName"
          value={form.bankName}
          onChange={handleChange}
          className="max-w-md w-full border border-gray-300 rounded px-4 py-2 bg-gray-100"
        >
          <option value="">Select Bank</option>
          {bankOptions.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center  gap-4">
        <label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 w-40 shrink-0">
          Account Number
        </label>
        <input
          id="accountNumber"
          name="accountNumber"
          placeholder="Enter account number"
          value={form.accountNumber}
          onChange={handleChange}
          className="max-w-md w-full border border-gray-300 rounded px-4 py-2 bg-gray-100"
        />
      </div>

      <div className="flex items-center  gap-4">
        <label htmlFor="accountName" className="text-sm font-medium text-gray-700 w-40 shrink-0">
          Account Name
        </label>
        <input
          id="accountName"
          name="accountName"
          placeholder="Enter account name"
          value={form.accountName}
          onChange={handleChange}
          className="max-w-md w-full border border-gray-300 rounded px-4 py-2 bg-gray-100"
        />
      </div>

      <div>
        <button
          type="submit"
          className="bg-Dblue hover:bg-blue-700 text-white font-medium px-6 py-2 rounded"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default BankDetailsForm;
