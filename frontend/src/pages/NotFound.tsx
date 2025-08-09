import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-900/20 mb-4">
          <Compass className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <Search className="h-4 w-4" />
            Explore dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}; 