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
    <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 space-y-6 w-full">
      <h2 className="text-xl font-semibold text-gray-800">Bank Details</h2>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label htmlFor="bankName" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Bank Name
        </label>
        <select
          name="bankName"
          id="bankName"
          value={form.bankName}
          onChange={handleChange}
          className="w-full max-w-full md:max-w-md border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none"
        >
          <option value="">Select Bank</option>
          {bankOptions.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Account Number
        </label>
        <input
          id="accountNumber"
          name="accountNumber"
          placeholder="Enter account number"
          value={form.accountNumber}
          onChange={handleChange}
          className="w-full max-w-full md:max-w-md border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label htmlFor="accountName" className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Account Name
        </label>
        <input
          id="accountName"
          name="accountName"
          placeholder="Enter account name"
          value={form.accountName}
          onChange={handleChange}
          className="w-full max-w-full md:max-w-md border border-gray-300 rounded px-4 py-2 bg-gray-100 focus:outline-none"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="bg-primary hover:bg-blue-700 text-white font-medium px-6 py-2 rounded w-full md:w-auto"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default BankDetailsForm;
