
'use client';

import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: '2px solid green', padding: '20px', margin: '10px' }}>
      <header style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        <h1>Dashboard Layout (Simplified)</h1>
        <p>This is a basic wrapper for dashboard pages.</p>
      </header>
      <main>
        {children}
      </main>
      <footer style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
        <p>Simple Dashboard Footer</p>
      </footer>
    </div>
  );
}
