'use client';

import React from 'react';
import '../admin.scss';

/**
 * StyleProvider for PayloadCMS Admin
 * Imports custom DiagnoLeads styles to match the main app's design system
 */
export function StyleProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default StyleProvider;
