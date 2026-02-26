'use client';

import React from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <p className="text-neutral-700 mb-4">Something went wrong.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
      >
        Try again
      </button>
    </div>
  );
}
