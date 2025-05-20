
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase-config';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Gift,
  Settings,
  LogOut,
  Mail,
  Image as ImageIcon,
  CalendarDays,
  Palette,
  Heart,
  Music,
  Home,
  ScrollText,
  Menu,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Logout Error:', error);
      // Optionally show a toast error
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LayoutDashboard className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // or a redirect component, though onAuthStateChanged handles it
  }

  const NavLink = ({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <SidebarMenuItem>
      <Link href={href} passHref legacyBehavior>
        <SidebarMenuButton>
          {icon}
          {children}
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );


  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader className="p-4 flex-row items-center group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:py-3 group-data-[state=collapsed]:px-1.5">
          <div className="flex flex-grow items-center gap-3 group-data-[state=collapsed]:justify-center">
            <Link href="/" className="flex items-center gap-2 group-data-[state=collapsed]:hidden">
              <Heart className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-xl font-semibold text-foreground whitespace-nowrap" style={{fontFamily: 'Times New Roman, Times, serif'}}>The Big Day</h2>
            </Link>
            {/* Desktop trigger, only shown when not mobile. Icon will change based on state (handled in SidebarTrigger) */}
            {!isMobile && (
              <SidebarTrigger className="ml-auto group-data-[state=collapsed]:ml-0 group-data-[state=collapsed]:mr-0" />
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 p-2">
          <SidebarGroup>
            <SidebarGroupLabel>My Wedding</SidebarGroupLabel>
            <SidebarMenu>
              <NavLink href="/dashboard" icon={<LayoutDashboard />}>Overview</NavLink>
              <NavLink href="/dashboard/details" icon={<ScrollText />}>Wedding Details</NavLink>
              <NavLink href="/dashboard/theme" icon={<Palette />}>Theme & Style</NavLink>
              <NavLink href="/dashboard/schedule" icon={<CalendarDays />}>Event Schedule</NavLink>
              <NavLink href="/dashboard/gallery" icon={<ImageIcon />}>Photo Gallery</NavLink>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Guests</SidebarGroupLabel>
            <SidebarMenu>
              <NavLink href="/dashboard/guests" icon={<Users />}>Guest List</NavLink>
              <NavLink href="/dashboard/rsvps" icon={<ListChecks />}>RSVP Management</NavLink>
              <NavLink href="/dashboard/invitations" icon={<Mail />}>Digital Invitations</NavLink>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

           <SidebarGroup>
            <SidebarGroupLabel>Extras</SidebarGroupLabel>
            <SidebarMenu>
              <NavLink href="/dashboard/registry" icon={<Gift />}>Gift Registry</NavLink>
              <NavLink href="/dashboard/music" icon={<Music />}>Playlist Voting</NavLink>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:items-center group-data-[state=collapsed]:text-center">
            <Avatar className="h-10 w-10 group-data-[state=collapsed]:mb-2">
              <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png?text=${user.email?.[0]?.toUpperCase() || 'U'}`} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback>{user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="group-data-[state=collapsed]:hidden">
              <p className="text-sm font-medium text-foreground truncate">{user.displayName || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full group-data-[state=collapsed]:hidden" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
           <Button variant="ghost" size="icon" className="w-full hidden group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
         {isMobile && (
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SidebarTrigger>
            <div className="flex-1">
               <Link href="/" className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground" style={{fontFamily: 'Times New Roman, Times, serif'}}>The Big Day</h2>
              </Link>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    