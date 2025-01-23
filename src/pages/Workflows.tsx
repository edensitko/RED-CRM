import React from 'react';
import { FaTools } from 'react-icons/fa';

const Workflows: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-890" dir="rtl">
    <div className="text-center p-10 bg-black rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
      <div className="flex justify-center mb-6">
        <FaTools className="text-6xl text-red-500 animate-bounce" />
      </div>
      <h1 className="text-3xl font-bold text-gray-100 mb-4">
        עמוד בשיפוצים
      </h1>
      <p className="text-gray-600 mb-6">
        הדף נמצא כרגע בתהליך של שדרוג ושיפוץ. אנא חזור מאוחר יותר.
      </p>
      <div className="bg-red-900 bg-opacity-30 border-l-4 border-red-600 p-4 rounded">
        <p className="text-red-300">
          <strong>הודעה:</strong> אנו עובדים על שיפור חווית המשתמש. תודה על הסבלנות.
        </p>
      </div>
    </div>
  </div>
  );
};

export default Workflows;