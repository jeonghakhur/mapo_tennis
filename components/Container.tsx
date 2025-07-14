import React from 'react';
import Navbar from './Navbar';

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-5 px-5 pb-15">{children}</main>
    </>
  );
}
