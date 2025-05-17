
'use client'; // Required for useState and other hooks

import React from 'react'; // Import React for useState
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  LogIn, Newspaper, Camera, ListChecks, Music, Gift, Users, Palette, Share2, ArrowRight,
  CheckCircle, Edit3, Send, Heart, Menu, X, Check, DollarSign, Star
} from 'lucide-react';

import type { Wedding } from '@/types/wedding';
import ElegantTemplate from '@/app/templates/wedding/elegant-template';
import ModernTemplate from '@/app/templates/wedding/modern-template';
import RusticTemplate from '@/app/templates/wedding/rustic-template';


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

interface TemplatesSectionProps {
  onPreview: (template: typeof WEDDING_TEMPLATES[0]) => void;
}

const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onPreview }) => {
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
                <Button
                  variant="outline"
                  className="mt-auto w-full"
                  onClick={() => onPreview(template)}
                >
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

const PRICING_PLANS = [
  {
    name: "Basic",
    price: "$49",
    period: "one-time",
    description: "Perfect for intimate celebrations with core features.",
    features: [
      "Custom wedding website",
      "RSVP management (up to 50 guests)",
      "Digital invitations",
      "Photo gallery (250 photos)",
      "6 months access"
    ],
    popular: false
  },
  {
    name: "Premium",
    price: "$99",
    period: "one-time",
    description: "Comprehensive features for the perfect celebration.",
    features: [
      "Everything in Basic",
      "RSVP management (up to 150 guests)",
      "Interactive guest games & polls",
      "Music playlist voting",
      "Unlimited photos",
      "12 months access"
    ],
    popular: true
  },
  {
    name: "Deluxe",
    price: "$149",
    period: "one-time",
    description: "For large weddings with all premium features.",
    features: [
      "Everything in Premium",
      "Unlimited guest count",
      "Seating planner",
      "Video & voice guestbook",
      "Custom domain name",
      "24 months access"
    ],
    popular: false
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that works best for your wedding celebration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card rounded-xl overflow-hidden flex flex-col ${
                plan.popular
                  ? "shadow-2xl border-2 border-primary transform md:-translate-y-4 scale-105 ring-4 ring-primary/20"
                  : "shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
              }`}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold tracking-wider uppercase">Most Popular</div>
              )}
              <div className="p-6 md:p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-semibold mb-2 text-foreground">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground"> / {plan.period}</span>
                </div>
                <p className="text-muted-foreground mb-6 text-sm flex-grow">{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <Check className="text-green-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  className="w-full mt-auto"
                  asChild
                >
                  <Link href="/auth?tab=register">Get Started</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const testimonialsData = [
  {
    quote: "The Big Day made our wedding planning so much easier! Our guests loved the interactive features, especially the photo sharing during the reception.",
    author: "Sarah & Michael",
    date: "Married June 2024",
    image: "https://placehold.co/100x100.png",
    aiHint: "happy couple portrait"
  },
  {
    quote: "The RSVP management saved us so much time and stress. We loved how easy it was to track everything in one place, and our guests found it super convenient.",
    author: "Jessica & David",
    date: "Married August 2024",
    image: "https://placehold.co/100x100.png",
    aiHint: "smiling couple"
  },
  {
    quote: "The playlist voting was a hit! Our DJ loved having input from our guests, and it created the perfect atmosphere. The photo gallery is a beautiful keepsake.",
    author: "Emma & James",
    date: "Married October 2024",
    image: "https://placehold.co/100x100.png",
    aiHint: "joyful couple"
  }
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Couples Say</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Hear from couples who created memorable wedding experiences with The Big Day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <div key={index} className="bg-card rounded-xl shadow-lg p-6 flex flex-col hover:shadow-xl transition-shadow duration-300">
              <div className="flex-grow">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6">"{testimonial.quote}"</p>
              </div>
              <div className="flex items-center mt-auto">
                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint={testimonial.aiHint}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.author}</h4>
                  <p className="text-muted-foreground text-sm">{testimonial.date}</p>
                </div>
              </div>
            </div>
          ))}
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
        <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          Ready to Start Planning <span className="text-primary">The Big Day</span>?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Sign up today and begin creating the wedding website of your dreams. It's free to get started!
        </p>
        <Button asChild size="lg" className="px-10 py-3 h-auto text-lg">
          <Link href="/auth?tab=register">Create Your Account</Link>
        </Button>
      </div>
    </section>
  );
};

const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-secondary border-t border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl text-foreground" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                The Big Day
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Create beautiful wedding websites to share your special day with family and friends.
            </p>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
               <li>
                <Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#templates" className="text-muted-foreground hover:text-primary transition-colors">
                  Templates
                </Link>
              </li>
               <li>
                <Link href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
               <li>
                <Link href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  Log In / Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Key Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Custom Websites</li>
              <li className="text-muted-foreground">Guest Management</li>
              <li className="text-muted-foreground">RSVP Tracking</li>
              <li className="text-muted-foreground">Photo Galleries</li>
              <li className="text-muted-foreground">Registry Links</li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Contact</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Have questions? We're here to help!
            </p>
            <p className="text-sm text-muted-foreground">
              support@thebigday.app
            </p>
          </div>
        </div>

        <Separator className="my-8 bg-border/50" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} The Big Day. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Sample data for template previews
const sampleWeddingData: Partial<Wedding> = {
  title: "Anna & Paul's Wedding",
  description: "We are so excited to celebrate our special day with all of our amazing friends and family! Join us for a day filled with love, laughter, and unforgettable memories as we begin our new journey together.",
  date: new Date(new Date().getFullYear() + 1, 5, 15, 16, 30, 0).toISOString(), // Example: June 15th next year, 4:30 PM
  location: "The Enchanted Garden, Springsville",
  coverPhoto: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwYmFucXVldCUyMHJvb218ZW58MHx8fHwxNzQ3NTg4OTg5fDA&ixlib=rb-4.0.3&q=80&w=1080",
  gallery: [
    { id: '1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&q=80&w=800&fit=crop&crop=entropy&cs=tinysrgb', description: 'Our first dance' },
    { id: '2', url: 'https://images.unsplash.com/photo-1523438003649-06009572282a?ixlib=rb-4.0.3&q=80&w=800&fit=crop&crop=entropy&cs=tinysrgb', description: 'Cutting the cake' },
    { id: '3', url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?ixlib=rb-4.0.3&q=80&w=800&fit=crop&crop=entropy&cs=tinysrgb', description: 'Cheers to forever' },
    { id: '4', url: 'https://images.unsplash.com/photo-1542042161-951353350513?ixlib=rb-4.0.3&q=80&w=800&fit=crop&crop=entropy&cs=tinysrgb', description: 'Beautiful venue' },
    { id: '5', url: 'https://images.unsplash.com/photo-1509610696553-9243c1e230f4?ixlib=rb-4.0.3&q=80&w=800&fit=crop&crop=entropy&cs=tinysrgb', description: 'The rings' },
    { id: '6', url: 'https://images.unsplash.com/photo-1541250848049-b4f7145d7327?ixlib=rb-4.0.3&q=80&w=800&fit=crop&crop=entropy&cs=tinysrgb', description: 'Sunset kiss' },
  ],
  schedule: [
    { time: '3:00 PM', event: 'Guest Arrival', description: 'Welcome drinks and light refreshments' },
    { time: '4:00 PM', event: 'Ceremony', description: 'Join us as we say "I do"' },
    { time: '5:00 PM', event: 'Cocktail Hour', description: 'Enjoy cocktails and appetizers' },
    { time: '6:30 PM', event: 'Reception', description: 'Dinner, dancing, and celebrations' },
    { time: '10:00 PM', event: 'Sparkler Send-off', description: 'Wish us well as we depart' },
  ],
  dressCode: "Semi-Formal: Suits, gowns, or cocktail dresses.",
  rsvpDeadline: new Date(new Date().getFullYear() + 1, 4, 1).toISOString(), // Example: May 1st next year
};


export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<typeof WEDDING_TEMPLATES[0] | null>(null);

  const handleOpenPreview = (template: typeof WEDDING_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setIsPreviewSheetOpen(true);
  };

  return (
    <div className="flex flex-col min-h-svh bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
              The Big Day
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
             <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-2 sm:px-3">
                <Link href="/#features">Features</Link>
             </Button>
             <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-2 sm:px-3">
                <Link href="/#templates">Templates</Link>
             </Button>
             <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-2 sm:px-3">
                <Link href="/#pricing">Pricing</Link>
             </Button>
            <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-2 sm:px-3">
                <Link href="/#how-it-works">How It Works</Link>
             </Button>
             <Separator orientation="vertical" className="h-6 mx-2"/>
             <Link href="/auth">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Login
                </Button>
             </Link>
             <Link href="/auth?tab=register">
                <Button size="sm" className="px-2 sm:px-3">
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
            <nav className="container flex flex-col space-y-1 py-4">
              <Link href="/#features" className="block py-2 px-3 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={closeMenu}>
                Features
              </Link>
              <Link href="/#templates" className="block py-2 px-3 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={closeMenu}>
                Templates
              </Link>
              <Link href="/#pricing" className="block py-2 px-3 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={closeMenu}>
                Pricing
              </Link>
              <Link href="/#how-it-works" className="block py-2 px-3 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={closeMenu}>
                How It Works
              </Link>
              <Separator className="my-2" />
              <Link href="/auth" onClick={closeMenu}>
                <Button variant="outline" className="w-full justify-start mb-2">
                  <LogIn className="mr-2 h-4 w-4" /> Log In
                </Button>
              </Link>
              <Link href="/auth?tab=register" onClick={closeMenu}>
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
        <TemplatesSection onPreview={handleOpenPreview} />
        <PricingSection />
        <TestimonialsSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      <AppFooter />

      <Sheet open={isPreviewSheetOpen} onOpenChange={setIsPreviewSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-0 overflow-y-auto">
          {selectedTemplate ? (
            <>
              <SheetHeader className="p-6 border-b bg-background sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <SheetTitle className="text-2xl">{selectedTemplate.name}</SheetTitle>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </SheetClose>
                </div>
                <SheetDescription>{selectedTemplate.description}</SheetDescription>
              </SheetHeader>

              {/* Render actual template */}
              {selectedTemplate.id === 'classic-elegance' && <ElegantTemplate wedding={sampleWeddingData} isPreviewMode={true} />}
              {selectedTemplate.id === 'modern-romance' && <ModernTemplate wedding={sampleWeddingData} isPreviewMode={true} />}
              {selectedTemplate.id === 'rustic-charm' && <RusticTemplate wedding={sampleWeddingData} isPreviewMode={true} />}
              {!['classic-elegance', 'modern-romance', 'rustic-charm'].includes(selectedTemplate.id) && (
                <div className="p-6">
                    <p className="text-muted-foreground">Preview for this template is not available yet.</p>
                </div>
              )}
            </>
          ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>No template selected for preview.</p>
                <p>Please close this panel and select a template to see its preview.</p>
              </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
