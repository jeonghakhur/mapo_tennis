import React from 'react';
import Navbar from './Navbar';

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="p-5">{children}</main>
    </>
  );
}
