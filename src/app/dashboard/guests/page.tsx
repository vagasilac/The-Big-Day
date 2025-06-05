'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  category: z.enum(["bride's", "bridegroom's", 'shared', 'service']).default("bride's"),
  relationship: z.enum(['family', 'friend', 'colleague', 'service']).default('friend'),
  familyGroup: z.string().optional().or(z.literal('')),
  headOfFamily: z.boolean().default(false),
  plusOneAllowed: z.boolean().default(false),
  plusOneName: z.string().optional().or(z.literal('')),
  invitedTo: z.array(z.string()).default([]),
  invitationCode: z.string().optional().or(z.literal('')),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined']).default('pending'),
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    relationship: 'all',
    rsvpStatus: 'all',
  });

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      category: "bride's",
      relationship: 'friend',
      familyGroup: '',
      headOfFamily: false,
      plusOneAllowed: false,
      plusOneName: '',
      invitedTo: [],
      invitationCode: '',
      rsvpStatus: 'pending',
    },
  });

  const watchPlusOne = form.watch('plusOneAllowed');

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
    form.reset({
      name: '',
      email: '',
      phone: '',
      category: "bride's",
      relationship: 'friend',
      familyGroup: '',
      headOfFamily: false,
      plusOneAllowed: false,
      plusOneName: '',
      invitedTo: [],
      invitationCode: '',
      rsvpStatus: 'pending',
    });
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
          category: values.category,
          relationship: values.relationship,
          familyGroup: values.familyGroup || '',
          headOfFamily: values.headOfFamily,
          plusOneAllowed: values.plusOneAllowed,
          plusOneName: values.plusOneName || '',
          invitedTo: values.invitedTo || [],
          invitationCode: values.invitationCode || '',
          rsvpStatus: values.rsvpStatus,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Guest updated' });
      } else {
        const ref = collection(db, 'weddings', weddingData.id, 'guests');
        await addDoc(ref, {
          name: values.name,
          email: values.email || '',
          phone: values.phone || '',
          category: values.category,
          relationship: values.relationship,
          familyGroup: values.familyGroup || '',
          headOfFamily: values.headOfFamily,
          plusOneAllowed: values.plusOneAllowed,
          plusOneName: values.plusOneName || '',
          invitedTo: values.invitedTo || [],
          invitationCode: values.invitationCode || '',
          rsvpStatus: values.rsvpStatus,
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
      category: guest.category || "bride's",
      relationship: guest.relationship || 'friend',
      familyGroup: guest.familyGroup || '',
      headOfFamily: !!guest.headOfFamily,
      plusOneAllowed: !!guest.plusOneAllowed,
      plusOneName: guest.plusOneName || '',
      invitedTo: guest.invitedTo || [],
      invitationCode: guest.invitationCode || '',
      rsvpStatus: guest.rsvpStatus || 'pending',
    });
    setEditingGuest(guest);
    setDialogOpen(true);
  };

  const filteredGuests = useMemo(
    () =>
      guests.filter((guest) => {
        return (
          guest.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filters.category === 'all' || guest.category === filters.category) &&
          (filters.relationship === 'all' || guest.relationship === filters.relationship) &&
          (filters.rsvpStatus === 'all' || guest.rsvpStatus === filters.rsvpStatus)
        );
      }),
    [guests, searchTerm, filters]
  );

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
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Guest Management</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10"
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="all">All Categories</option>
                  <option value="bride's">Bride's Guest</option>
                  <option value="bridegroom's">Bridegroom's Guest</option>
                  <option value="shared">Shared Guest</option>
                  <option value="service">Service Provider</option>
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.relationship}
                  onChange={(e) => setFilters((f) => ({ ...f, relationship: e.target.value }))}
                >
                  <option value="all">All Relationships</option>
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="colleague">Colleague</option>
                  <option value="service">Service</option>
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.rsvpStatus}
                  onChange={(e) => setFilters((f) => ({ ...f, rsvpStatus: e.target.value }))}
                >
                  <option value="all">All RSVP Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              {loadingGuests ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredGuests.length === 0 ? (
                <p className="text-muted-foreground">No guests match your criteria.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Invited To</TableHead>
                      <TableHead>RSVP</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>{guest.name}</TableCell>
                        <TableCell className="capitalize">{guest.category?.replace("'", '’') || '-'}</TableCell>
                        <TableCell className="capitalize">{guest.relationship || '-'}</TableCell>
                        <TableCell className="capitalize">{guest.invitedTo?.join(', ').replace(/_/g, ' ') || '-'}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              guest.rsvpStatus === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : guest.rsvpStatus === 'declined'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {guest.rsvpStatus || 'pending'}
                          </span>
                        </TableCell>
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select className="w-full h-10 rounded-md border border-input px-3" {...field}>
                            <option value="bride's">Bride's Guest</option>
                            <option value="bridegroom's">Bridegroom's Guest</option>
                            <option value="shared">Shared Guest</option>
                            <option value="service">Service Provider</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <select className="w-full h-10 rounded-md border border-input px-3" {...field}>
                            <option value="family">Family</option>
                            <option value="friend">Friend</option>
                            <option value="colleague">Colleague</option>
                            <option value="service">Service</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="familyGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Group</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Smith Family" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="headOfFamily"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input type="checkbox" className="mr-2" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                        </FormControl>
                        <FormLabel>Head of Family</FormLabel>
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
                  {watchPlusOne && (
                    <FormField
                      control={form.control}
                      name="plusOneName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plus-One Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Plus one name" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">Invited To</p>
                    <div className="flex flex-col space-y-1 pl-1 mt-1">
                      {['ceremony', 'reception', 'welcome_dinner'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.getValues('invitedTo').includes(type)}
                            onChange={() => {
                              const current = form.getValues('invitedTo');
                              if (current.includes(type)) {
                                form.setValue('invitedTo', current.filter((t) => t !== type));
                              } else {
                                form.setValue('invitedTo', [...current, type]);
                              }
                            }}
                          />
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="invitationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invitation Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-generated if blank" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rsvpStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RSVP Status</FormLabel>
                        <FormControl>
                          <select className="w-full h-10 rounded-md border border-input px-3" {...field}>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="declined">Declined</option>
                          </select>
                        </FormControl>
                        <FormMessage />
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
