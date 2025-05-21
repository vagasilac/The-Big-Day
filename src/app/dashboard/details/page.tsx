
'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
import { ArrowLeft, CalendarIcon, Loader2, ScrollText, ImageIcon, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { auth, db, storage } from '@/lib/firebase-config'; // Ensure storage is imported
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  collection,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import type { Wedding } from '@/types/wedding';

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
  coverPhoto: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')), // Stores the URL
  templateId: z.string().min(1, { message: 'Please select a template.' }),
});

type WeddingFormValues = z.infer<typeof weddingFormSchema>;

const MOCK_TEMPLATES = [
  { id: 'classic-elegance', name: 'Classic Elegance', dataAiHint: 'template classic' },
  { id: 'modern-romance', name: 'Modern Romance', dataAiHint: 'template modern' },
  { id: 'rustic-charm', name: 'Rustic Charm', dataAiHint: 'template rustic' },
];

export default function WeddingDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isNewWedding, setIsNewWedding] = useState(false);
  const [weddingDocId, setWeddingDocId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [currentCoverPhotoUrl, setCurrentCoverPhotoUrl] = useState<string | null>(null);


  const form = useForm<WeddingFormValues>({
    resolver: zodResolver(weddingFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      date: undefined,
      time: '',
      location: '',
      description: '',
      coverPhoto: '',
      templateId: MOCK_TEMPLATES[0].id,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/auth');
      }
      setIsLoadingUser(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchWeddingData = async () => {
      setIsLoadingData(true);
      try {
        const weddingsRef = collection(db, 'weddings');
        const q = query(weddingsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const weddingDoc = querySnapshot.docs[0];
          const weddingData = weddingDoc.data() as Wedding;
          setWeddingDocId(weddingDoc.id);
          setIsNewWedding(false);
          setCurrentCoverPhotoUrl(weddingData.coverPhoto || null);

          let formDate: Date | undefined = undefined;
          let formTime: string = '';

          if (weddingData.date && weddingData.date instanceof Timestamp) {
            formDate = weddingData.date.toDate();
            const hours = formDate.getHours().toString().padStart(2, '0');
            const minutes = formDate.getMinutes().toString().padStart(2, '0');
            formTime = `${hours}:${minutes}`;
          }

          form.reset({
            title: weddingData.title || '',
            slug: weddingData.slug || '',
            date: formDate,
            time: formTime,
            location: weddingData.location || '',
            description: weddingData.description || '',
            coverPhoto: weddingData.coverPhoto || '',
            templateId: weddingData.templateId || MOCK_TEMPLATES[0].id,
          });
        } else {
          setIsNewWedding(true);
          setCurrentCoverPhotoUrl(null);
          form.reset({
            title: '', slug: '', date: undefined, time: '', location: '', description: '', coverPhoto: '', templateId: MOCK_TEMPLATES[0].id,
          });
        }
      } catch (error) {
        console.error('Error fetching wedding data:', error);
        toast({ title: 'Error', description: 'Could not load wedding details.', variant: 'destructive' });
        setIsNewWedding(true);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchWeddingData();
  }, [currentUser, form, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  async function onSubmit(data: WeddingFormValues) {
    if (!currentUser) {
      toast({ title: 'Not Authenticated', description: 'Please log in to save.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);

    let finalCoverPhotoUrl = form.getValues('coverPhoto');

    if (selectedFile) {
      setIsUploading(true);
      try {
        const filePath = `cover_photos/${currentUser.uid}/${weddingDocId || `new_${Date.now()}`}/${selectedFile.name}`;
        const fileStorageRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, selectedFile);

        await uploadTask;
        finalCoverPhotoUrl = await getDownloadURL(uploadTask.snapshot.ref);
        form.setValue('coverPhoto', finalCoverPhotoUrl);
        setCurrentCoverPhotoUrl(finalCoverPhotoUrl);
        setSelectedFile(null);
        setFilePreview(null);
        toast({ title: 'Upload Successful', description: 'Cover photo updated.' });
      } catch (error) {
        console.error('Error uploading cover photo:', error);
        toast({ title: 'Upload Failed', description: 'Could not upload cover photo.', variant: 'destructive' });
        setIsUploading(false);
        setIsSaving(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    let combinedDateTime: Timestamp | null = null;
    if (data.date) {
      const dateObj = new Date(data.date);
      if (data.time) {
        const [hours, minutes] = data.time.split(':').map(Number);
        dateObj.setHours(hours, minutes, 0, 0);
      } else {
        dateObj.setHours(0,0,0,0);
      }
      combinedDateTime = Timestamp.fromDate(dateObj);
    }

    const weddingDataToSave: Omit<Wedding, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: Timestamp, createdAt?: Timestamp } = {
      userId: currentUser.uid,
      title: data.title,
      slug: data.slug,
      date: combinedDateTime,
      location: data.location || '',
      description: data.description || '',
      coverPhoto: finalCoverPhotoUrl || '',
      templateId: data.templateId,
      updatedAt: serverTimestamp() as Timestamp,
    };

    try {
      if (isNewWedding) {
        weddingDataToSave.createdAt = serverTimestamp() as Timestamp;
        const docRef = await addDoc(collection(db, 'weddings'), weddingDataToSave);
        setWeddingDocId(docRef.id);
        setIsNewWedding(false);
        toast({ title: 'Wedding Created!', description: `Your wedding "${data.title}" has been successfully created.` });
      } else if (weddingDocId) {
        const weddingRef = doc(db, 'weddings', weddingDocId);
        await setDoc(weddingRef, weddingDataToSave, { merge: true });
        toast({ title: 'Changes Saved!', description: `Your wedding "${data.title}" has been successfully updated.` });
      }
    } catch (error) {
      console.error('Error saving wedding data:', error);
      toast({ title: 'Error Saving', description: 'Could not save wedding details.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoadingUser || isLoadingData) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                    <Skeleton className="h-10 w-72 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
            </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-56 mb-2" />
               <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-36 w-full" />
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <ScrollText className="h-8 w-8 text-primary" />
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
                        <span className="text-sm text-muted-foreground p-2 bg-secondary rounded-l-md border border-r-0 border-input h-10 flex items-center">
                          your-site.com/weddings/
                        </span>
                        <Input
                          placeholder="anna-paul"
                          className="rounded-l-none"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      A unique identifier for your wedding URL (e.g., anna-paul).
                      Use lowercase letters, numbers, and hyphens only.
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
                              date < new Date(new Date().setDate(new Date().getDate() -1))
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

              {/* Cover Photo Upload Section */}
              <FormItem>
                <FormLabel>Upload Cover Photo</FormLabel>
                <div className="space-y-4">
                  <div className="w-full max-w-sm h-48 relative bg-secondary rounded-md overflow-hidden border border-dashed flex items-center justify-center">
                    {filePreview ? (
                      <Image src={filePreview} alt="Cover photo preview" layout="fill" objectFit="cover" />
                    ) : currentCoverPhotoUrl ? (
                      <Image src={currentCoverPhotoUrl} alt="Current cover photo" layout="fill" objectFit="cover" data-ai-hint="wedding couple" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="mx-auto h-12 w-12" />
                        <p>No cover photo selected</p>
                      </div>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      id="cover-photo-upload"
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </FormControl>
                  {filePreview && selectedFile && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedFile(null); setFilePreview(null); (document.getElementById('cover-photo-upload') as HTMLInputElement).value = ''; }}
                        className="text-destructive hover:text-destructive"
                        disabled={isUploading}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Selection
                    </Button>
                  )}
                </div>
                <FormDescription>
                  Choose an image to be displayed as the main photo for your wedding.
                </FormDescription>
                <FormMessage>{form.formState.errors.coverPhoto?.message}</FormMessage>
              </FormItem>
              {/* Hidden FormField for coverPhoto URL, controlled programmatically */}
               <FormField
                  control={form.control}
                  name="coverPhoto"
                  render={({ field }) => (
                    <FormItem className="sr-only">
                      <FormLabel>Cover Photo URL</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
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
                              className="sr-only"
                            />
                            <div className="text-center">
                              <div
                                className="w-full h-32 bg-secondary rounded-md mb-2 flex items-center justify-center text-muted-foreground text-sm"
                                data-ai-hint={template.dataAiHint}
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
            <Button type="submit" size="lg" disabled={isSaving || isLoadingUser || isLoadingData || isUploading}>
              {(isSaving || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUploading ? 'Uploading...' : isSaving
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
