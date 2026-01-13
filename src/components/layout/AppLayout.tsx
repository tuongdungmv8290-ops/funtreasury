import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TreasurySidebar } from './TreasurySidebar';
import { AppHeader } from './AppHeader';
import { ViewOnlyWatermark } from '@/components/ViewOnlyWatermark';

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <TreasurySidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader />
          <ViewOnlyWatermark />
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
