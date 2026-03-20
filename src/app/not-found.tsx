'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-page">
      <p className="text-lg font-semibold text-neutral-900">Page not found</p>
      <p className="mt-2 text-sm text-neutral-600 text-center max-w-md">
        This page does not exist or you do not have access.
      </p>
      <Link
        href="/"
        className="mt-8 text-sm font-semibold text-primary-600 hover:text-primary-700"
      >
        Go to home
      </Link>
    </div>
  );
}
