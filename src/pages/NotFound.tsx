import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-2xl text-gray-700 mb-8">Page Not Found</p>
      <Link to="/" className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300">
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;
