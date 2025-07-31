import React from 'react';
import Navbar from './Navbar';

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-4 px-5 pb-15 border-t border-gray-200">{children}</main>
    </>
  );
}
