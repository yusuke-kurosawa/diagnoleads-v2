'use client';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import Backdrop from '@/components/layout/Backdrop';
import { useSidebar } from '@/context/SidebarContext';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
        }`}
      >
        <AppHeader />
        <main className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </ThemeProvider>
  );
}
