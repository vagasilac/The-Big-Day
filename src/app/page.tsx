
'use client';

import React from 'react';
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
  Newspaper, Camera, ListChecks, Music, Gift, Users, Palette, Share2, ArrowRight,
  CheckCircle, Edit3, Send, Heart, Menu, X, Check, DollarSign, Star
} from 'lucide-react';

import type { Wedding } from '@/types/wedding';
import ElegantTemplate from './templates/wedding/elegant-template';
import ModernTemplate from './templates/wedding/modern-template';
import RusticTemplate from './templates/wedding/rustic-template';

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background text-center md:text-left">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
                dangerouslySetInnerHTML={{ __html: "Make your wedding day <span class=\"text-primary\">truly special</span>" }} />
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto md:mx-0">
              Create a stunning wedding website with interactive guest features, RSVP management, photo sharing, and everything you need to plan your perfect day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild size="lg" className="px-8 py-3 h-auto text-base">
                <Link href="/auth?tab=register">Create Your Wedding Site</Link>
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

const featuresData = [
  { icon: Newspaper, title: "Customizable Website", description: "Choose from elegant templates and personalize every detail of your wedding website." },
  { icon: ListChecks, title: "RSVP Management", description: "Easily track guest responses, meal preferences, and plus-ones in real-time." },
  { icon: Camera, title: "Photo Sharing", description: "Allow guests to upload photos and create a beautiful shared gallery of memories." },
  { icon: Gift, title: "Gift Registry Links", description: "Integrate your gift registries and make it easy for guests to find your wish list." },
  { icon: Users, title: "Guest List Tools", description: "Manage your guest list, seating arrangements, and communication effortlessly." },
  { icon: Palette, title: "Theme Editor", description: "Match your website to your wedding's color scheme and style with our intuitive editor." },
  { icon: Music, title: "Playlist Collaboration", description: "Let guests suggest songs and help create the perfect soundtrack for your celebration." },
  { icon: Share2, title: "Easy Sharing", description: "Share your wedding website link with guests via email, social media, or printed invitations." },
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
          {featuresData.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-card rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center"
              >
                <div className="bg-primary/10 p-4 rounded-full mb-6 inline-flex">
                  <IconComponent className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
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
    image: 'https://images.unsplash.com/photo-1498771857520-25063edc30c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOHx8Y2xhc3NpY3xlbnwwfHx8fDE3NDc2MTAwMTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'classic wedding invitation'
  },
  {
    id: 'modern-romance',
    name: 'Modern Romance',
    description: 'Chic and contemporary, perfect for the modern couple.',
    image: 'https://images.unsplash.com/photo-1518464622742-9aeb03009561?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxtb2Rlcm4lMjByb21hbmNlfGVufDB8fHx8MTc0NzYxMDE1NXww&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'modern wedding invitation'
  },
  {
    id: 'rustic-charm',
    name: 'Rustic Charm',
    description: 'Warm and inviting, ideal for a countryside or barn wedding.',
    image: 'https://images.unsplash.com/photo-1731128852828-06b745c46c22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxydXN0aWMlMjBjaGFybXxlbnwwfHx8fDE3NDc2MTAyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
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
    name: "Basic Plan", price: "$49", period: "one-time", description: "Perfect for intimate celebrations with core features to get you started.",
    features: [ "Customizable wedding website", "RSVP management (up to 50 guests)", "Standard photo gallery", "Digital invitations", "3 Template choices" ], popular: false
  },
  {
    name: "Premium Plan", price: "$99", period: "one-time", description: "Our most popular plan with comprehensive features for the perfect celebration.",
    features: [ "Everything in Basic Plan", "RSVP management (up to 150 guests)", "Advanced photo gallery with albums", "Guest messaging tools", "All Templates access", "Playlist collaboration" ], popular: true
  },
  {
    name: "Deluxe Plan", price: "$149", period: "one-time", description: "All-inclusive features for large weddings and those who want it all.",
    features: [ "Everything in Premium Plan", "Unlimited guest count", "Custom domain name support", "Video guestbook feature", "Priority support" ], popular: false
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
            Choose the plan that best fits your needs. No hidden fees, just straightforward pricing for your special day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card rounded-xl overflow-hidden flex flex-col ${
                plan.popular ? "shadow-2xl border-2 border-primary transform md:-translate-y-4 scale-105 ring-4 ring-primary/20" : "shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
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
                  {plan.features.map((featureKey, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <Check className="text-green-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-foreground">{featureKey}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.popular ? "default" : "outline"} size="lg" className="w-full mt-auto" asChild>
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
    quote: "The Big Day made our wedding planning so much easier! Our guests loved the interactive features, especially the photo sharing during the reception. Highly recommend!",
    author: "Sarah & Michael L.", date: "Married June 2024",
    image: "https://images.unsplash.com/photo-1541800033-180008982215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGNvdXBsZSUyMHBvcnRyYWl0fGVufDB8fHx8MTc0NzYxMzg3N3ww&ixlib=rb-4.0.3&q=80&w=100",
    aiHint: "happy couple portrait"
  },
  {
    quote: "The RSVP management saved us so much time. Our guests found it super convenient, and the theme editor helped us match our website to our wedding style perfectly!",
    author: "Jessica & David P.", date: "Married August 2024",
    image: "https://images.unsplash.com/photo-1515628507581-e69258294274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGNvdXBsZSUyMHBvcnRyYWl0fGVufDB8fHx8MTc0NzYxMzg3N3ww&ixlib=rb-4.0.3&q=80&w=100",
    aiHint: "joyful couple outdoors"
  },
  {
    quote: "Absolutely loved the playlist collaboration feature! It made our reception so much more personal. The photo gallery is a beautiful keepsake. Five stars!",
    author: "Emma & James K.", date: "Married October 2024",
    image: "https://images.unsplash.com/photo-1507609413669-f529768f0904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxoYXBweSUyMGNvdXBsZSUyMHBvcnRyYWl0fGVufDB8fHx8MTc0NzYxMzg3N3ww&ixlib=rb-4.0.3&q=80&w=100",
    aiHint: "smiling couple wedding"
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Couples Say</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Hear from happy couples who created memorable and beautiful wedding experiences with The Big Day.
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
    { icon: <Edit3 className="w-10 h-10 text-primary" />, title: "1. Sign Up & Create", description: "Create your account, choose a beautiful template, and start personalizing your wedding website in minutes." },
    { icon: <Palette className="w-10 h-10 text-primary" />, title: "2. Add Your Details", description: "Easily add your wedding information, love story, photos, event schedule, and gift registry links." },
    { icon: <Send className="w-10 h-10 text-primary" />, title: "3. Share & Celebrate", description: "Share your unique website link, manage RSVPs, and engage with your guests through interactive features." }
  ];
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
           <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Creating your dream wedding website is simple and intuitive with our easy-to-use platform.
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
                Explore a Live Demo
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                See a fully featured demo wedding website. Experience both the guest view and the powerful admin dashboard.
              </p>
              <Button asChild size="lg" className="px-8 py-3 h-auto text-base self-center md:self-start">
                <Link href="/#how-it-works"> {/* Placeholder for demo link */}
                  View Demo Website
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="md:w-1/2 relative aspect-video md:aspect-auto min-h-[300px] md:min-h-0">
              <Image
                src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwd2Vic2l0ZSUyMGxhcHRvcHxlbnwwfHx8fDE3NDc2MTQwNzB8MA&ixlib=rb-4.0.3&q=80&w=1080"
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
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            dangerouslySetInnerHTML={{ __html: "Ready to Start Planning <span class=\"text-primary\">The Big Day</span>?" }} />
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
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear());

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

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
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/#templates" className="text-muted-foreground hover:text-primary transition-colors">Templates</Link></li>
              <li><Link href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link href="/auth" className="text-muted-foreground hover:text-primary transition-colors">Login</Link></li>
              <li><Link href="/auth?tab=register" className="text-muted-foreground hover:text-primary transition-colors">Sign Up</Link></li>
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
            <p className="text-sm text-muted-foreground mb-2">Have questions? We're here to help!</p>
            <p className="text-sm text-muted-foreground">support@thebigday.app</p>
          </div>
        </div>
        <Separator className="my-8 bg-border/50" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: `&copy; ${currentYear} The Big Day. All rights reserved.` }} />
        </div>
      </div>
    </footer>
  );
};

const sampleWeddingData: Partial<Wedding> = {
  title: "Anna & Paul's Wedding",
  description: "We are so excited to celebrate our special day with all of our amazing friends and family! Join us for a day filled with love, laughter, and unforgettable memories as we begin our new journey together.",
  date: "2026-06-15T17:30:00.000Z", 
  location: "The Enchanted Garden, Springsville",
  coverPhoto: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwYmFucXVldCUyMHJvb218ZW58MHx8fHwxNzQ3NTg4OTg5fDA&ixlib=rb-4.0.3&q=80&w=1080",
  gallery: [
    { id: "1", url: "https://images.unsplash.com/photo-1522346513757-54c352451edb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwcm9wb3NhbCUyMGJlYWNofGVufDB8fHx8MTc0NzY5NTQ0MHww&ixlib=rb-4.0.3&q=80&w=400", description: "The Proposal", dataAiHint: "proposal beach sunset"},
    { id: "2", url: "https://images.unsplash.com/photo-1591604466107-ec97de527c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwcm9wb3NhbCUyMGJlYWNofGVufDB8fHx8MTc0NzY5NTQ0MHww&ixlib=rb-4.0.3&q=80&w=400", description: "She said yes!", dataAiHint: "engagement ring hand"},
    { id: "3", url: "https://images.unsplash.com/photo-1508808937599-06c4f5855260?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwdmVudWUlMjBnYXJkZW58ZW58MHx8fHwxNzQ3Njk1NTA1fDA&ixlib=rb-4.0.3&q=80&w=400", description: "Our Future Venue", dataAiHint: "wedding venue garden"},
    { id: "4", url: "https://images.unsplash.com/photo-1589156218404-209c028574b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx3ZWRkaW5nJTIwdmVudWUlMjBnYXJkZW58ZW58MHx8fHwxNzQ3Njk1NTA1fDA&ixlib=rb-4.0.3&q=80&w=400", description: "Venue Details", dataAiHint: "outdoor wedding setup"},
    { id: "5", url: "https://images.unsplash.com/photo-1552873829-78940e407a4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxlbmdhZ2VtZW50JTIwcGhvdG9zJTIwY291cGxlfGVufDB8fHx8MTc0NzY5NTU1NHww&ixlib=rb-4.0.3&q=80&w=400", description: "Engagement Photos", dataAiHint: "engagement photos couple"},
    { id: "6", url: "https://images.unsplash.com/photo-1580403390485-499ea959307f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxlbmdhZ2VtZW50JTIwcGhvdG9zJTIwY291cGxlfGVufDB8fHx8MTc0NzY5NTU1NHww&ixlib=rb-4.0.3&q=80&w=400", description: "Save the Date", dataAiHint: "couple holding hands"},
  ],
  schedule: [
    { time: "3:00 PM", event: "Guest Arrival", description: "Welcome drinks and light refreshments" },
    { time: "4:00 PM", event: "Ceremony", description: "Join us as we say \"I do\"" },
    { time: "5:00 PM", event: "Cocktail Hour", description: "Enjoy cocktails and appetizers" },
    { time: "6:30 PM", event: "Reception", description: "Dinner, dancing, and celebrations" },
    { time: "10:00 PM", event: "Sparkler Send-off", description: "Wish us well as we depart" }
  ],
  dressCode: "Semi-Formal: Suits, gowns, or cocktail dresses.",
  rsvpDeadline: "2026-04-30T23:59:00.000Z" 
};

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<typeof WEDDING_TEMPLATES[0] | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleOpenPreview = (template: typeof WEDDING_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setIsPreviewSheetOpen(true);
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;
    const templateProps = { wedding: sampleWeddingData, isPreviewMode: true };
    switch (selectedTemplate.id) {
      case 'classic-elegance':
        return <ElegantTemplate {...templateProps} />;
      case 'modern-romance':
        return <ModernTemplate {...templateProps} />;
      case 'rustic-charm':
        return <RusticTemplate {...templateProps} />;
      default:
        return <p className="p-4">Preview not available for this template.</p>;
    }
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
          <div className="flex items-center space-x-1">
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
              <Button variant="ghost" size="sm" asChild className="px-2 sm:px-3">
                <Link href="/auth">Login</Link>
              </Button>
              <Link href="/auth?tab=register">
                <Button size="sm" className="px-2 sm:px-3">Sign Up</Button>
              </Link>
            </nav>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="flex flex-col px-4 py-2 space-y-1">
              <Button variant="ghost" asChild className="justify-start text-muted-foreground" onClick={closeMenu}>
                <Link href="/#features">Features</Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start text-muted-foreground" onClick={closeMenu}>
                <Link href="/#templates">Templates</Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start text-muted-foreground" onClick={closeMenu}>
                <Link href="/#pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start text-muted-foreground" onClick={closeMenu}>
                <Link href="/#how-it-works">How It Works</Link>
              </Button>
              <Separator className="my-2" />
              <Button variant="outline" asChild className="w-full" onClick={closeMenu}>
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild className="w-full" onClick={closeMenu}>
                <Link href="/auth?tab=register">Sign Up</Link>
              </Button>
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
        <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:w-2/5 xl:w-1/3 p-0 overflow-y-auto">
          <SheetHeader className="p-6 border-b bg-background sticky top-0 z-20">
            <SheetTitle>{selectedTemplate?.name || "Template Preview"}</SheetTitle>
            <SheetDescription>
              This is a preview of the {selectedTemplate?.name || "selected"} template.
            </SheetDescription>
            <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </SheetHeader>
          <div className="relative z-0"> 
            {renderTemplatePreview()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

