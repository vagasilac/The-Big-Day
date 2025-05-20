
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, ListChecks, PlusCircle, Eye, Edit, Heart } from 'lucide-react';

// Mocked data for demonstration
const mockWedding = {
  id: 'demo-wedding',
  slug: 'demo-and-partner',
  title: "Demo & Partner's Wedding",
  date: new Date(new Date().setDate(new Date().getDate() + 93)).toISOString(), // Approx 93 days from now
  location: 'The Grand Venue, Dream City',
  coverPhoto: 'https://placehold.co/800x600.png', // Placeholder for cover
  dataAiHint: 'wedding venue',
};

const mockStats = {
  guestCount: 0,
  rsvpCount: 0,
};

// Simple countdown logic (replace with a more robust library if needed)
const CountdownTimer = ({ targetDateISO }: { targetDateISO: string | null }) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    if (!targetDateISO) {
      setTimeLeft('Date not set');
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDateISO) - +new Date();
      let newTimeLeft = '';

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        newTimeLeft = `${days}d ${hours}h ${minutes}m`;
      } else {
        newTimeLeft = 'The big day is here or has passed!';
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDateISO]);

  return <div className="text-3xl font-bold text-foreground">{timeLeft}</div>;
};


export default function DashboardPage() {
  // For now, we'll use the mocked data.
  // In a real app, you'd fetch this data based on the logged-in user.
  const weddings = [mockWedding]; // Assume the user has one wedding for now
  const currentWedding = weddings[0];
  const stats = mockStats;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your wedding planning all in one place.
          </p>
        </div>
        {!currentWedding && ( // Show create button if no wedding exists
           <Button asChild className="mt-4 sm:mt-0">
            <Link href="/dashboard/weddings/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Wedding Site
            </Link>
          </Button>
        )}
      </div>

      {currentWedding ? (
        <>
          {/* Wedding Details Card */}
          <Card className="shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
              <div className="relative aspect-[4/3] md:aspect-auto">
                <Image
                  src={currentWedding.coverPhoto}
                  alt={currentWedding.title || 'Wedding cover photo'}
                  fill
                  className="object-cover"
                  data-ai-hint={currentWedding.dataAiHint}
                />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <CardTitle className="text-2xl lg:text-3xl mb-1">{currentWedding.title}</CardTitle>
                  <CardDescription className="text-base mb-3">
                    {currentWedding.date
                      ? new Date(currentWedding.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Date to be announced'}
                  </CardDescription>
                  {currentWedding.location && (
                    <p className="text-sm text-muted-foreground mb-4">
                      At {currentWedding.location}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <Button variant="outline" asChild>
                    <Link href={`/weddings/${currentWedding.slug}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Site
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/dashboard/details`}> {/* Simplified to one wedding */}
                      <Edit className="mr-2 h-4 w-4" />
                      Manage Wedding
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Countdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CountdownTimer targetDateISO={currentWedding.date} />
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Total Guests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.guestCount}</div>
                <p className="text-xs text-muted-foreground">invited</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <ListChecks className="mr-2 h-4 w-4" />
                  RSVPs Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.rsvpCount}</div>
                 <p className="text-xs text-muted-foreground">responded</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        // This part is for when there are no weddings - simplified from your example for now
        <Card className="border-dashed border-2 p-8 text-center shadow-sm">
           <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <CardTitle className="text-xl font-semibold mb-2">No Wedding Site Yet</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
            It looks like you haven&apos;t created your wedding site. Get started to manage all your details!
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/weddings/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your Wedding Site
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
