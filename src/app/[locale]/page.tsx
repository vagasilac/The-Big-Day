
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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

import type { Wedding } from '@/types/wedding'; // Ensure this path is correct
import ElegantTemplate from '@/app/templates/wedding/elegant-template';
import ModernTemplate from '@/app/templates/wedding/modern-template';
import RusticTemplate from '@/app/templates/wedding/rustic-template';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const HeroSection = () => {
  const t = useTranslations('HomePage');
  return (
    <section className="py-16 md:py-24 bg-background text-center md:text-left">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
                dangerouslySetInnerHTML={{ __html: t.raw('heroTitle') }} />
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto md:mx-0">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild size="lg" className="px-8 py-3 h-auto text-base">
                <Link href="/auth?tab=register">{t('heroButtonCreate')}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8 py-3 h-auto text-base">
                <Link href="/#features">{t('heroButtonDiscover')}</Link>
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

const featuresData = [ // Renamed from 'features' to avoid conflict with section name
  { icon: Newspaper, titleKey: "features.customizableWebsite.title", descriptionKey: "features.customizableWebsite.description" },
  { icon: ListChecks, titleKey: "features.rsvpManagement.title", descriptionKey: "features.rsvpManagement.description" },
  { icon: Camera, titleKey: "features.photoSharing.title", descriptionKey: "features.photoSharing.description" },
  { icon: Gift, titleKey: "features.giftRegistry.title", descriptionKey: "features.giftRegistry.description" },
  { icon: Users, titleKey: "features.guestListTools.title", descriptionKey: "features.guestListTools.description" },
  { icon: Palette, titleKey: "features.themeEditor.title", descriptionKey: "features.themeEditor.description" },
  { icon: Music, titleKey: "features.playlistCollaboration.title", descriptionKey: "features.playlistCollaboration.description" },
  { icon: Share2, titleKey: "features.easySharing.title", descriptionKey: "features.easySharing.description" },
];


const FeaturesSection = () => {
  // TODO: Add translations for features titles and descriptions in en.json and es.json
  // For example, in en.json:
  // "features": {
  //   "customizableWebsite": {
  //     "title": "Customizable Website",
  //     "description": "Choose from elegant templates and personalize every detail of your wedding website."
  //   }, ...
  // }
  // Then use t(feature.titleKey) and t(feature.descriptionKey)
  return (
    <section id="features" className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Your Special Day {/* TODO: Translate */}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            "The Big Day" offers a suite of tools to make your wedding planning seamless and your celebration unforgettable. {/* TODO: Translate */}
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
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.titleKey}</h3> {/* TODO: Replace with t(feature.titleKey) */}
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.descriptionKey}</p> {/* TODO: Replace with t(feature.descriptionKey) */}
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
    name: 'Classic Elegance', // TODO: Translate
    description: 'A timeless design with sophisticated typography and a clean layout.', // TODO: Translate
    image: 'https://images.unsplash.com/photo-1498771857520-25063edc30c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOHx8Y2xhc3NpY3xlbnwwfHx8fDE3NDc2MTAwMTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'classic wedding invitation'
  },
  {
    id: 'modern-romance',
    name: 'Modern Romance', // TODO: Translate
    description: 'Chic and contemporary, perfect for the modern couple.', // TODO: Translate
    image: 'https://images.unsplash.com/photo-1518464622742-9aeb03009561?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxtb2Rlcm4lMjByb21hbmNlfGVufDB8fHx8MTc0NzYxMDE1NXww&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'modern wedding invitation'
  },
  {
    id: 'rustic-charm',
    name: 'Rustic Charm', // TODO: Translate
    description: 'Warm and inviting, ideal for a countryside or barn wedding.', // TODO: Translate
    image: 'https://images.unsplash.com/photo-1731128852828-06b745c46c22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxydXN0aWMlMjBjaGFybXxlbnwwfHx8fDE3NDc2MTAyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'rustic wedding invitation'
  },
];

interface TemplatesSectionProps {
  onPreview: (template: typeof WEDDING_TEMPLATES[0]) => void;
}

const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onPreview }) => {
  // TODO: Translate section title and description, and individual template names/descriptions
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
                  Preview Template {/* TODO: Translate */}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="px-8 py-3 h-auto text-base group">
            <Link href="/#templates"> {/* May need locale prefixing here */}
              Browse All Templates {/* TODO: Translate */}
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
  // TODO: Translate section title, description, plan names, descriptions, features
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
                  <Link href="/auth?tab=register">Get Started</Link> {/* TODO: Translate */}
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
    image: "https://images.unsplash.com/photo-1541800033-180008982215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGNvdXBsZSUyMHBvcnRyYWl0fGVufDB8fHx8MTc0NzYxMzg3N3ww&ixlib=rb-4.0.3&q=80&w=100",
    aiHint: "happy couple portrait"
  },
  // ... other testimonials
];

const TestimonialsSection = () => {
  // TODO: Translate section title, description, testimonials
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
    { icon: <Edit3 className="w-10 h-10 text-primary" />, title: "1. Sign Up & Create", description: "Create an account and select your favorite template to customize your wedding website." },
    { icon: <Palette className="w-10 h-10 text-primary" />, title: "2. Add Your Details", description: "Add your wedding information, photos, and manage your guest list all in one place." },
    { icon: <Send className="w-10 h-10 text-primary" />, title: "3. Share & Celebrate", description: "Send invitations, collect RSVPs, and enjoy all the interactive features with your guests." }
  ];
  // TODO: Translate section title, description, steps
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
                See a Live Demo {/* TODO: Translate */}
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Explore a fully featured demo wedding website. Experience both the guest view and the powerful admin dashboard. {/* TODO: Translate */}
              </p>
              <Button asChild size="lg" className="px-8 py-3 h-auto text-base self-center md:self-start">
                <Link href="/#how-it-works">
                  View Demo Website {/* TODO: Translate */}
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
  // TODO: Translate title, description, button
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
  const t = useTranslations('HomePage');
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
              {t('appFooterBrandSlogan')}
            </p>
          </div>
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{t('appFooterQuickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">{t('appFooterHome')}</Link></li>
              <li><Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors">{t('headerFeatures')}</Link></li>
              <li><Link href="/#templates" className="text-muted-foreground hover:text-primary transition-colors">{t('headerTemplates')}</Link></li>
              <li><Link href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">{t('headerPricing')}</Link></li>
              <li><Link href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">{t('headerHowItWorks')}</Link></li>
              <li><Link href="/auth" className="text-muted-foreground hover:text-primary transition-colors">{t('headerLogin')}</Link></li>
              <li><Link href="/auth?tab=register" className="text-muted-foreground hover:text-primary transition-colors">{t('headerSignUp')}</Link></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{t('appFooterKeyFeatures')}</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">{t('appFooterCustomWebsites')}</li>
              <li className="text-muted-foreground">{t('appFooterGuestManagement')}</li>
              <li className="text-muted-foreground">{t('appFooterRsvpTracking')}</li>
              <li className="text-muted-foreground">{t('appFooterPhotoGalleries')}</li>
              <li className="text-muted-foreground">{t('appFooterRegistryLinks')}</li>
            </ul>
          </div>
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">{t('appFooterContact')}</h3>
            <p className="text-sm text-muted-foreground mb-2">{t('appFooterContactIntro')}</p>
            <p className="text-sm text-muted-foreground">{t('appFooterContactEmail')}</p>
          </div>
        </div>
        <Separator className="my-8 bg-border/50" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('appFooterCopyright', {currentYear}) }} />
        </div>
      </div>
    </footer>
  );
};

const sampleWeddingData: Partial<Wedding> = { /* ... same as before ... */ };

export default function HomePage() {
  const t = useTranslations('HomePage');
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
          <div className="flex items-center space-x-1">
            <LanguageSwitcher />
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Button variant="link" asChild className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-2 sm:px-3">
                <Link href="/#features">{t('headerFeatures')}</Link>
              </Button>
              {/* ... other nav links ... */}
              <Link href="/auth?tab=register">
                <Button size="sm" className="px-2 sm:px-3">{t('headerSignUp')}</Button>
              </Link>
            </nav>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile Menu ... */}
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
        {/* ... Sheet Content ... */}
      </Sheet>
    </div>
  );
}
