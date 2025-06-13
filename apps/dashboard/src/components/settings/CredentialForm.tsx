// /components/Settings/CredentialForm.tsx
import React, { useState } from "react";
import { CredentialDetails } from "../../types/settings.types";
import { PdfIcon } from "../../assets/icons"

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
      <div className="flex-1 max-w-full md:max-w-md relative">
        <input
          type="file"
          accept="application/pdf"
          name="resume"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
        />
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 px-3 py-2 rounded-md">
          <PdfIcon/>
          <span className="text-sm text-gray-600">Choose resume</span>
        </div>
      </div>
    </div>
  
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
      <label className="text-sm font-medium text-gray-700 w-full md:w-40 shrink-0">
        Upload Certification
      </label>
      <div className="flex-1 max-w-full md:max-w-md relative">
        <input
          type="file"
          accept="application/pdf"
          name="certification"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
        />
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 px-3 py-2 rounded-md">
          <PdfIcon/>
          <span className="text-sm text-gray-600">Choose certification</span>
        </div>
      </div>
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

export default CredentialForm;
