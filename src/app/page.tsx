
'use client'; // Required for useState and other hooks

import React from 'react'; // Import React for useState
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  LogIn, Newspaper, Camera, ListChecks, Music, Gift, Users, Palette, Share2, ArrowRight, 
  CheckCircle, Edit3, Send, Heart, Menu, X
} from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background text-center md:text-left">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Make your wedding day <span className="text-primary">truly special</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto md:mx-0">
              Create a stunning wedding website with interactive guest features, RSVP management, photo sharing, and everything you need to plan your perfect day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild size="lg" className="px-8 py-3 h-auto text-base">
                <Link href="/auth">Create Your Wedding Site</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8 py-3 h-auto text-base">
                <Link href="/#features">Discover Features</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-full max-w-xl mx-auto">
              <Image
                src="https://images.unsplash.com/photo-1550005809-91ad75fb315f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMXx8d2VkZGluZ3xlbnwwfHx8fDE3NDczNDU2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Elegant wedding scene"
                width={800}
                height={600}
                className="rounded-xl shadow-2xl w-full h-full object-cover"
                priority
                data-ai-hint="elegant wedding celebration"
              />
              <div className="absolute -bottom-5 -right-5 bg-card p-4 rounded-lg shadow-xl border-2 border-primary">
                <div className="text-xl md:text-2xl text-primary" style={{ fontFamily: 'Times New Roman, Times, serif' }}>Anna & Paul</div>
                <p className="text-muted-foreground text-xs md:text-sm">June 15, 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const features = [
  {
    icon: <Newspaper className="w-8 h-8 text-primary" />,
    title: "Customizable Website",
    description: "Choose from elegant templates and personalize every detail of your wedding website.",
  },
  {
    icon: <ListChecks className="w-8 h-8 text-primary" />,
    title: "RSVP Management",
    description: "Easily track guest responses, meal preferences, and plus-ones in real-time.",
  },
  {
    icon: <Camera className="w-8 h-8 text-primary" />,
    title: "Photo Sharing",
    description: "Allow guests to upload photos and create a beautiful shared gallery of memories.",
  },
  {
    icon: <Gift className="w-8 h-8 text-primary" />,
    title: "Gift Registry Links",
    description: "Integrate your gift registries and make it easy for guests to find your wish list.",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Guest List Tools",
    description: "Manage your guest list, seating arrangements, and communication effortlessly.",
  },
  {
    icon: <Palette className="w-8 h-8 text-primary" />,
    title: "Theme Editor",
    description: "Match your website to your wedding's color scheme and style with our intuitive editor.",
  },
  {
    icon: <Music className="w-8 h-8 text-primary" />,
    title: "Playlist Collaboration",
    description: "Let guests suggest songs and help create the perfect soundtrack for your celebration.",
  },
  {
    icon: <Share2 className="w-8 h-8 text-primary" />,
    title: "Easy Sharing",
    description: "Share your wedding website link with guests via email, social media, or printed invitations.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Your Special Day
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            "The Big Day" offers a suite of tools to make your wedding planning seamless and your celebration unforgettable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <div className="bg-primary/10 p-4 rounded-full mb-6 inline-flex">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WEDDING_TEMPLATES = [
  {
    id: 'classic-elegance',
    name: 'Classic Elegance',
    description: 'A timeless design with sophisticated typography and a clean layout.',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'classic wedding invitation'
  },
  {
    id: 'modern-romance',
    name: 'Modern Romance',
    description: 'Chic and contemporary, perfect for the modern couple.',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'modern wedding invitation'
  },
  {
    id: 'rustic-charm',
    name: 'Rustic Charm',
    description: 'Warm and inviting, ideal for a countryside or barn wedding.',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'rustic wedding invitation'
  },
];

const TemplatesSection = () => {
  return (
    <section id="templates" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <Palette className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Beautiful Wedding Templates
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Choose from our collection of professionally designed templates. Personalize with your photos, colors, and content to create a unique wedding website.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {WEDDING_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              <div className="relative aspect-video w-full">
                <Image
                  src={template.image}
                  alt={`${template.name} template preview`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-t-xl"
                  data-ai-hint={template.aiHint}
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-2 text-foreground">{template.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow">{template.description}</p>
                <Button variant="outline" className="mt-auto w-full">
                  Preview Template
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="px-8 py-3 h-auto text-base group">
            {/* TODO: Create /templates page and link here */}
            <Link href="/#templates">
              Browse All Templates
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      icon: <Edit3 className="w-10 h-10 text-primary" />,
      title: "1. Sign Up & Create",
      description: "Create an account and select your favorite template to customize your wedding website."
    },
    {
      icon: <Palette className="w-10 h-10 text-primary" />,
      title: "2. Add Your Details",
      description: "Add your wedding information, photos, and manage your guest list all in one place."
    },
    {
      icon: <Send className="w-10 h-10 text-primary" />,
      title: "3. Share & Celebrate",
      description: "Send invitations, collect RSVPs, and enjoy all the interactive features with your guests."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
           <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Creating your dream wedding website is simple and takes just a few minutes to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="text-center p-6 bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4" style={{fontFamily: 'Times New Roman, Times, serif'}}>
                See a Live Demo
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Explore a fully featured demo wedding website. Experience both the guest view and the powerful admin dashboard.
              </p>
              <Button asChild size="lg" className="px-8 py-3 h-auto text-base self-center md:self-start">
                {/* TODO: Create /demo page and link here */}
                <Link href="/#how-it-works">
                  View Demo Website
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="md:w-1/2 relative aspect-video md:aspect-auto min-h-[300px] md:min-h-0">
              <Image
                src="https://placehold.co/800x600.png"
                alt="Wedding website demo on a laptop"
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint="wedding website laptop"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


const CTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          Ready to Start Planning <span className="text-primary">The Big Day</span>?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Sign up today and begin creating the wedding website of your dreams. It's free to get started!
        </p>
        <Button asChild size="lg" className="px-10 py-3 h-auto text-lg">
          <Link href="/auth">Get Started Now</Link>
        </Button>
      </div>
    </section>
  );
};

const AppFooter = () => {
  return (
    <footer className="py-12 bg-secondary border-t border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl text-primary" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                The Big Day
              </span>
            </div>
            <p className="text-secondary-foreground mb-4">
              Create beautiful wedding websites to share your special day with family and friends.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-secondary-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#templates" className="text-secondary-foreground hover:text-primary transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-secondary-foreground hover:text-primary transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-secondary-foreground hover:text-primary transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Features */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Features</h3>
            <ul className="space-y-2">
              <li className="text-secondary-foreground">Wedding Websites</li>
              <li className="text-secondary-foreground">Guest Management</li>
              <li className="text-secondary-foreground">RSVP Tracking</li>
              <li className="text-secondary-foreground">Photo Sharing</li>
              <li className="text-secondary-foreground">Interactive Polls</li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Contact</h3>
            <p className="text-secondary-foreground mb-2">
              Have questions? We're here to help!
            </p>
            <p className="text-secondary-foreground">
              support@thebigday.app
            </p>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-sm text-secondary-foreground">
            &copy; {new Date().getFullYear()} The Big Day. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};


export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="flex flex-col min-h-svh bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
              The Big Day
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
             <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <Link href="/#features">Features</Link>
             </Button>
             <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <Link href="/#templates">Templates</Link>
             </Button>
            <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <Link href="/#how-it-works">How It Works</Link>
             </Button>
             <Link href="/auth">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Login
                </Button>
             </Link>
             <Link href="/auth">
                <Button size="sm">
                  Sign Up
                </Button>
             </Link>
          </nav>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border shadow-md">
            <nav className="container flex flex-col space-y-2 py-4">
              <Link href="/#features" className="block py-2 text-muted-foreground hover:text-primary" onClick={closeMenu}>
                Features
              </Link>
              <Link href="/#templates" className="block py-2 text-muted-foreground hover:text-primary" onClick={closeMenu}>
                Templates
              </Link>
              <Link href="/#how-it-works" className="block py-2 text-muted-foreground hover:text-primary" onClick={closeMenu}>
                How It Works
              </Link>
              <Separator className="my-2" />
              <Link href="/auth" onClick={closeMenu}>
                <Button variant="outline" className="w-full justify-start">
                  <LogIn className="mr-2 h-4 w-4" /> Log In
                </Button>
              </Link>
              <Link href="/auth" onClick={closeMenu}>
                <Button className="w-full justify-start">
                  Sign Up
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <TemplatesSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      <AppFooter />
    </div>
  );
}
