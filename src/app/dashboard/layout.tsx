
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
  useSidebar, 
  sidebarMenuButtonVariants 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Gift,
  LogOut,
  Mail,
  ImageIcon,
  CalendarDays,
  GanttChart,
  Palette,
  Heart,
  Music,
  ScrollText,
  Menu,
  Armchair, // Added Armchair icon
  Map,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode; 
  tooltip?: string;
}

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
    return null; 
  }

  const NavLink = ({ href, icon, children: label, tooltip }: NavLinkProps) => {
    const { isMobile: sidebarIsMobile, state: sidebarState, openMobile } = useSidebar();
    const effectiveSidebarState = sidebarIsMobile ? (openMobile ? 'expanded' : 'collapsed') : sidebarState;
    const showLabel = effectiveSidebarState === 'expanded' || (sidebarIsMobile && openMobile);

    const linkContent = (
      <>
        {icon}
        {showLabel && <span className="flex-1 min-w-0 truncate">{label}</span>}
      </>
    );

    const linkElement = (
      <Link
        href={href}
        className={cn(
          sidebarMenuButtonVariants({ variant: 'default', size: 'default' }),
          'w-full', 
          !showLabel && 'justify-center' 
        )}
      >
        {linkContent}
      </Link>
    );

    if (tooltip && (!showLabel || sidebarIsMobile) ) {
      return (
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger className="w-full"> 
              {linkElement}
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    return <SidebarMenuItem>{linkElement}</SidebarMenuItem>;
  };


  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader className="p-4 flex-row items-center group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:py-3 group-data-[state=collapsed]:px-1.5">
          <div className="flex flex-grow items-center gap-3 group-data-[state=collapsed]:justify-center">
            <Link href="/" className="flex items-center gap-2 group-data-[state=collapsed]:hidden">
              <Heart className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-xl font-semibold text-foreground whitespace-nowrap" style={{fontFamily: 'Times New Roman, Times, serif'}}>The Big Day</h2>
            </Link>
            {!isMobile && (
              <SidebarTrigger className="ml-auto group-data-[state=collapsed]:ml-0 group-data-[state=collapsed]:mr-0" />
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 p-2">
          <SidebarGroup>
            <SidebarGroupLabel>My Wedding</SidebarGroupLabel>
            <SidebarMenu>
              <NavLink href="/dashboard" icon={<LayoutDashboard />} tooltip="Overview">Overview</NavLink>
              <NavLink href="/dashboard/details" icon={<ScrollText />} tooltip="Wedding Details">Wedding Details</NavLink>
              <NavLink href="/dashboard/theme" icon={<Palette />} tooltip="Theme & Style">Theme & Style</NavLink>
              <NavLink href="/dashboard/schedule" icon={<CalendarDays />} tooltip="Event Schedule">Event Schedule</NavLink>
              <NavLink href="/dashboard/planner" icon={<GanttChart />} tooltip="Planner">Planner</NavLink>
              <NavLink href="/dashboard/gallery" icon={<ImageIcon />} tooltip="Photo Gallery">Photo Gallery</NavLink>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Guests</SidebarGroupLabel>
            <SidebarMenu>
              <NavLink href="/dashboard/guests" icon={<Users />} tooltip="Guest Management">Guest Management</NavLink>
              <NavLink href="/dashboard/invitations" icon={<Mail />} tooltip="Digital Invitations">Digital Invitations</NavLink>
              <NavLink href="/dashboard/seating" icon={<Armchair />} tooltip="Seating Arrangements">Seating Arrangements</NavLink>
              <NavLink href="/dashboard/blueprints" icon={<Map />} tooltip="Venue Blueprints">Venue Blueprints</NavLink>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

           <SidebarGroup>
            <SidebarGroupLabel>Extras</SidebarGroupLabel>
            <SidebarMenu>
              <NavLink href="/dashboard/registry" icon={<Gift />} tooltip="Gift Registry">Gift Registry</NavLink>
              <NavLink href="/dashboard/music" icon={<Music />} tooltip="Playlist Voting">Playlist Voting</NavLink>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:items-center group-data-[state=collapsed]:text-center">
            <Avatar className="h-10 w-10 group-data-[state=collapsed]:mb-2">
              <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png?text=${user.email?.[0]?.toUpperCase() || 'U'}`} alt={user.displayName || user.email || 'User'} data-ai-hint="user profile" />
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

      <SidebarInset className="flex flex-col w-full max-w-screen overflow-x-hidden">
         {isMobile && (
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger asChild><Button size="icon" variant="outline" className="sm:hidden"><Menu className="h-5 w-5" /><span className="sr-only">Toggle Menu</span></Button></SidebarTrigger>
            <div className="flex-1">
               <Link href="/" className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground" style={{fontFamily: 'Times New Roman, Times, serif'}}>The Big Day</h2>
              </Link>
            </div>
          </header>
        )}
        <main className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto w-full max-w-screen p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    
