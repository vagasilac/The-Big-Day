
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Gift, Mail, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* Optional: Add a simple logo/icon here */}
            <span className="px-2 font-bold sm:inline-block text-lg" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
              Sarah &amp; Tom
            </span>
          </Link>
          <nav className="flex flex-1 items-center space-x-4 justify-end">
             <Link href="#story" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hidden sm:inline-block">Our Story</Link>
             <Link href="#details" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hidden sm:inline-block">Details</Link>
             <Link href="#registry" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hidden sm:inline-block">Registry</Link>
             <Link href="#rsvp" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hidden sm:inline-block">RSVP</Link>
             <Link href="/auth">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
             </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white">
          <Image
            src="https://picsum.photos/1600/900"
            alt="Couple celebrating"
            layout="fill"
            objectFit="cover"
            quality={80}
            className="absolute inset-0 z-0 opacity-70"
            data-ai-hint="wedding couple romantic outdoor"
          />
          <div className="relative z-10 p-4 md:p-8 bg-black/30 rounded-lg backdrop-blur-sm">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
              Sarah &amp; Tom
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-6">
              Are getting married!
            </p>
            <p className="text-md md:text-lg font-medium">
              October 26, 2024 | Dreamy Venue, Somewhere Beautiful
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section id="story" className="container mx-auto py-16 md:py-24 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Story</h2>
          <Card className="max-w-3xl mx-auto shadow-md overflow-hidden">
            <div className="md:flex">
               <div className="md:shrink-0">
                 <Image
                    src="https://picsum.photos/400/400"
                    alt="Couple photo"
                    width={400}
                    height={400}
                    className="h-48 w-full object-cover md:h-full md:w-64"
                    data-ai-hint="couple smiling happy"
                 />
               </div>
               <CardContent className="p-6 md:p-8">
                 <p className="text-muted-foreground leading-relaxed">
                   It all started on a rainy Tuesday... [Your story goes here. Keep it relatively concise and engaging. Maybe highlight a key moment or two.] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                 </p>
                 <p className="text-muted-foreground leading-relaxed mt-4">
                   We can't wait to celebrate the next chapter of our lives with all of you!
                 </p>
               </CardContent>
            </div>
          </Card>
        </section>

        <Separator className="my-8 md:my-12" />

        {/* Event Details Section */}
        <section id="details" className="container mx-auto py-16 md:py-24 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Calendar className="w-6 h-6 text-primary" />
                <CardTitle>Ceremony</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Saturday, October 26, 2024</p>
                <p className="text-muted-foreground">4:00 PM</p>
                <Separator className="my-3" />
                <p className="font-semibold">St. Elegant Chapel</p>
                <p className="text-muted-foreground">123 Chapel Lane, Somewhere Beautiful</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                   <a href="#" target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" /> View Map
                   </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <MapPin className="w-6 h-6 text-primary" />
                <CardTitle>Reception</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="font-semibold">Saturday, October 26, 2024</p>
                 <p className="text-muted-foreground">6:00 PM onwards</p>
                 <Separator className="my-3" />
                 <p className="font-semibold">The Grand Ballroom</p>
                 <p className="text-muted-foreground">456 Celebration Ave, Somewhere Beautiful</p>
                 <Button variant="outline" size="sm" className="mt-4" asChild>
                   <a href="#" target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-2 h-4 w-4" /> View Map
                   </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
             <CardDescription className="max-w-xl mx-auto">
                Additional details like dress code, parking information, or accommodation suggestions can go here.
             </CardDescription>
          </div>
        </section>

        <Separator className="my-8 md:my-12" />

        {/* Registry Section */}
        <section id="registry" className="container mx-auto py-16 md:py-24 px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Registry</h2>
          <Card className="max-w-lg mx-auto shadow-md">
             <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                   <Gift className="w-6 h-6 text-primary" />
                   <span>Our Wish List</span>
                </CardTitle>
             </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Your presence at our wedding is the greatest gift of all! However, if you wish to honor us with a gift, we have registered at the following places.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">Visit Registry 1</a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">Visit Registry 2</a>
                </Button>
                {/* Add more registry links as needed */}
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8 md:my-12" />

        {/* RSVP Section */}
        <section id="rsvp" className="container mx-auto py-16 md:py-24 px-4 text-center">
           <h2 className="text-3xl md:text-4xl font-bold mb-8">RSVP</h2>
           <Card className="max-w-lg mx-auto shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center justify-center space-x-2">
                   <Mail className="w-6 h-6 text-primary" />
                   <span>Kindly Respond</span>
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground mb-6">
                 Please let us know if you can celebrate with us by September 15, 2024.
               </p>
               {/* Basic RSVP prompt - replace with a form or link */}
               <Button size="lg" asChild>
                 <Link href="#">RSVP Here</Link>
                 {/* Consider linking to a form (Google Forms, dedicated service)
                     or creating a simple RSVP form component */}
               </Button>
               <CardDescription className="mt-4 text-sm">
                 Having trouble? Email us at <a href="mailto:sarah.tom.wedding@example.com" className="underline hover:text-primary">sarah.tom.wedding@example.com</a>
               </CardDescription>
             </CardContent>
           </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-secondary text-secondary-foreground">
        <div className="container mx-auto text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Sarah & Tom. Made with love.</p>
        </div>
      </footer>
    </div>
  );
}

