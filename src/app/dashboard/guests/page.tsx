'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, PlusCircle, Users, Edit, Trash, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { Guest } from '@/types/guest';

const guestFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  plusOneAllowed: z.boolean().default(false),
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

export default function GuestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      plusOneAllowed: false,
    },
  });

  // Fetch user and wedding
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const weddingsRef = collection(db, 'weddings');
          const q = query(weddingsRef, where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const weddingDoc = snapshot.docs[0];
            setWeddingData({ id: weddingDoc.id, ...weddingDoc.data() } as Wedding);
          } else {
            setWeddingData(null);
          }
        } catch (error) {
          console.error('Error fetching wedding data:', error);
          setWeddingData(null);
        }
      } else {
        setCurrentUser(null);
        setWeddingData(null);
        router.push('/auth');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Load guests when wedding data available
  useEffect(() => {
    const loadGuests = async () => {
      if (!weddingData?.id) return;
      setLoadingGuests(true);
      try {
        const guestsRef = collection(db, 'weddings', weddingData.id, 'guests');
        const snapshot = await getDocs(guestsRef);
        const list: Guest[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Guest) }));
        setGuests(list);
      } catch (error) {
        console.error('Error loading guests:', error);
      } finally {
        setLoadingGuests(false);
      }
    };
    loadGuests();
  }, [weddingData]);

  const resetForm = () => {
    form.reset({ name: '', email: '', phone: '', plusOneAllowed: false });
    setEditingGuest(null);
  };

  const handleSubmit = async (values: GuestFormValues) => {
    if (!weddingData?.id) return;
    setSaving(true);
    try {
      if (editingGuest && editingGuest.id) {
        const ref = doc(db, 'weddings', weddingData.id, 'guests', editingGuest.id);
        await updateDoc(ref, {
          name: values.name,
          email: values.email || '',
          phone: values.phone || '',
          plusOneAllowed: values.plusOneAllowed,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Guest updated' });
      } else {
        const ref = collection(db, 'weddings', weddingData.id, 'guests');
        await addDoc(ref, {
          name: values.name,
          email: values.email || '',
          phone: values.phone || '',
          plusOneAllowed: values.plusOneAllowed,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Guest added' });
      }
      // reload guests
      const guestsRef = collection(db, 'weddings', weddingData.id, 'guests');
      const snapshot = await getDocs(guestsRef);
      const list: Guest[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Guest) }));
      setGuests(list);
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving guest:', error);
      toast({ title: 'Error', description: 'Could not save guest', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (!weddingData?.id || !guest.id) return;
    try {
      const ref = doc(db, 'weddings', weddingData.id, 'guests', guest.id);
      await deleteDoc(ref);
      setGuests((prev) => prev.filter((g) => g.id !== guest.id));
      toast({ title: 'Guest removed' });
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast({ title: 'Error', description: 'Could not delete guest', variant: 'destructive' });
    }
  };

  const startEdit = (guest: Guest) => {
    form.reset({
      name: guest.name || '',
      email: guest.email || '',
      phone: guest.phone || '',
      plusOneAllowed: !!guest.plusOneAllowed,
    });
    setEditingGuest(guest);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {!weddingData ? (
        <Card className="border-dashed border-2 p-8 text-center shadow-sm">
          <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <CardTitle className="text-xl font-semibold mb-2">No Wedding Site Yet</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
            Please create your wedding site first to manage your guest list.
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/details">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your Wedding Site
            </Link>
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Guest List</h1>
              <p className="text-muted-foreground mt-1">Manage your wedding guests and their details.</p>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guests</CardTitle>
                <CardDescription>{guests.length} total</CardDescription>
              </div>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Guest
              </Button>
            </CardHeader>
            <CardContent>
              {loadingGuests ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : guests.length === 0 ? (
                <p className="text-muted-foreground">No guests have been added yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>{guest.name}</TableCell>
                        <TableCell>{guest.email || '-'}</TableCell>
                        <TableCell>{guest.phone || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(guest)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Guest</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {guest.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(guest)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}> 
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>{editingGuest ? 'Edit Guest' : 'Add Guest'}</DialogTitle>
                <DialogDescription>
                  {editingGuest ? 'Update guest information.' : 'Enter guest details below.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Guest name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email (optional)" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone (optional)" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plusOneAllowed"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input type="checkbox" className="mr-2" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                        </FormControl>
                        <FormLabel>Allow plus one</FormLabel>
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingGuest ? 'Save Changes' : 'Add Guest'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
