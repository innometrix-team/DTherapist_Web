// /components/Settings/CredentialForm.tsx
import React, { useState } from "react";
import { CredentialDetails } from "../../types/settings.types";

const CredentialForm: React.FC = () => {
  const [form, setForm] = useState<CredentialDetails>({
    resume: null,
    certification: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setForm({ ...form, [name]: files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.resume || !form.certification) {
      alert("Please upload both Resume and Certification files.");
      return;
    }
    console.log("Submitting Credential Files:", form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 space-y-6 w-full">
      <h2 className="text-xl font-semibold">Credential Upload</h2>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Upload Resume
        </label>
        <input
          type="file"
          accept="application/pdf"
          name="resume"
          onChange={handleFileChange}
          className="flex-1 max-w-full md:max-w-md bg-gray-100 border border-gray-300 px-3 py-2 rounded-md file:py-2 file:px-4 file:border-0 file:text-sm file:bg-Dblue file:text-white"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <label className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
          Upload Certification
        </label>
        <input
          type="file"
          accept="application/pdf"
          name="certification"
          onChange={handleFileChange}
          className="flex-1 max-w-full md:max-w-md bg-gray-100 border border-gray-300 px-3 py-2 rounded-md file:py-2 file:px-4 file:border-0 file:text-sm file:bg-Dblue file:text-white"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="bg-Dblue hover:bg-blue-700 text-white font-medium px-6 py-2 rounded w-full md:w-auto"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default CredentialForm;
