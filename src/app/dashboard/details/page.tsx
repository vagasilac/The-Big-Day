
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react';

const weddingFormSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  slug: z
    .string()
    .min(3, { message: 'URL slug must be at least 3 characters.' })
    .regex(/^[a-z0-9-]+$/, {
      message:
        'URL slug can only contain lowercase letters, numbers, and hyphens.',
    }),
  date: z.date().optional(),
  time: z.string().optional(), // e.g., "14:30"
  location: z.string().optional(),
  description: z.string().optional(),
  // For now, templateId will be a string. We can expand this later.
  templateId: z.string().min(1, { message: 'Please select a template.' }),
});

type WeddingFormValues = z.infer<typeof weddingFormSchema>;

// Mock templates for selection
const MOCK_TEMPLATES = [
  { id: 'classic-elegance', name: 'Classic Elegance' },
  { id: 'modern-romance', name: 'Modern Romance' },
  { id: 'rustic-charm', name: 'Rustic Charm' },
];

export default function WeddingDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // For now, we assume creating a new wedding. Editing will be added later.
  const isNewWedding = false; 

  const form = useForm<WeddingFormValues>({
    resolver: zodResolver(weddingFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      date: undefined,
      time: '',
      location: '',
      description: '',
      templateId: MOCK_TEMPLATES[0].id, // Default to the first template
    },
  });

  async function onSubmit(data: WeddingFormValues) {
    setIsSaving(true);
    console.log('Wedding Details Submitted:', data);

    // Combine date and time
    let combinedDateTime: Date | undefined = undefined;
    if (data.date) {
      combinedDateTime = new Date(data.date);
      if (data.time) {
        const [hours, minutes] = data.time.split(':').map(Number);
        combinedDateTime.setHours(hours, minutes);
      }
    }
    console.log('Combined DateTime:', combinedDateTime?.toISOString());

    // Mock saving data
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: isNewWedding ? 'Wedding Created!' : 'Changes Saved!',
      description: `Your wedding "${data.title}" has been successfully ${isNewWedding ? 'created' : 'updated'}.`,
    });
    setIsSaving(false);

    // For a new wedding, you might redirect to a page showing the new wedding or back to dashboard
    // For an existing wedding, you might just stay on the page or show a success message.
    if (isNewWedding) {
      router.push('/dashboard'); // Or to the newly created wedding's management page
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {isNewWedding ? 'Create Your Wedding Site' : 'Edit Wedding Details'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNewWedding
              ? 'Fill in the details below to get your wedding website started.'
              : 'Update your wedding information and settings.'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Basic Information</CardTitle>
              <CardDescription>
                Enter the core details for your wedding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wedding Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Anna & Paul's Big Day"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be the main title of your wedding website.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wedding URL Slug</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground p-2 bg-secondary rounded-l-md border border-r-0 border-input">
                          your-site.com/weddings/
                        </span>
                        <Input
                          placeholder="anna-paul"
                          className="rounded-l-none"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      A unique identifier for your wedding URL (e.g., anna-paul).
                      Use lowercase letters, numbers, and hyphens.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Wedding Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal h-10',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() -1)) // Allow today
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The official date of your wedding.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Wedding Time</FormLabel>
                      <FormControl>
                        <Input type="time" className="h-10 w-full" {...field} />
                      </FormControl>
                      <FormDescription>
                        The start time of your main event.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., The Grand Ballroom, Cityville"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      The primary venue or location of your wedding.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Our Story / Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share a bit about your journey or a welcome message for your guests..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be displayed on your wedding website.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Website Template</CardTitle>
              <CardDescription>
                Choose a design for your wedding website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select a Template</FormLabel>
                    <FormControl>
                       {/* Basic radio group for template selection for now */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {MOCK_TEMPLATES.map((template) => (
                          <label
                            key={template.id}
                            htmlFor={template.id}
                            className={cn(
                              "border rounded-md p-4 cursor-pointer hover:border-primary transition-all",
                              field.value === template.id && "border-primary ring-2 ring-primary ring-offset-2"
                            )}
                          >
                            <input
                              type="radio"
                              id={template.id}
                              value={template.id}
                              checked={field.value === template.id}
                              onChange={() => field.onChange(template.id)}
                              className="sr-only" // Hide actual radio, style label
                            />
                            <div className="text-center">
                              {/* Placeholder for template image */}
                              <div 
                                className="w-full h-32 bg-secondary rounded-md mb-2 flex items-center justify-center text-muted-foreground text-sm"
                                data-ai-hint={`template ${template.name.toLowerCase()}`}
                              >
                                Image for {template.name}
                              </div>
                              <span className="font-medium text-foreground">{template.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSaving
                ? 'Saving...'
                : isNewWedding
                ? 'Create Wedding Website'
                : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

