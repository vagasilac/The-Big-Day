
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
  DialogClose,
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
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, PlusCircle, Users, Edit, Trash, Mail, Loader2, Eye } from 'lucide-react';
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
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { Guest } from '@/types/guest';

const guestFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  category: z.enum(["bride's", "bridegroom's", 'shared', 'service']).default("bride's"),
  relationship: z.enum(['family', 'friend', 'colleague', 'service', 'plus-one']).default('friend'),
  familyGroup: z.string().optional().or(z.literal('')),
  headOfFamily: z.boolean().default(false),
  plusOneAllowed: z.boolean().default(false),
  plusOneName: z.string().optional().or(z.literal('')),
  invitedTo: z.array(z.string()).default([]),
  invitationCode: z.string().optional().or(z.literal('')),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined', 'maybe']).default('pending'),
  personalMessage: z.string().optional().or(z.literal('')),
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

export default function GuestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestMap, setGuestMap] = useState<Map<string, string>>(new Map());
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

  const [sending, setSending] = useState(false);
  const [currentGuestForAction, setCurrentGuestForAction] = useState<Guest | null>(null);
  
  // State for Invitation Preview
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [invitationPreviewHtml, setInvitationPreviewHtml] = useState('');
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);


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
      personalMessage: '',
    },
  });

  const watchPlusOne = form.watch('plusOneAllowed');

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

  const loadGuests = async () => {
    if (!weddingData?.id) return;
    setLoadingGuests(true);
    try {
      const guestsRef = collection(db, 'weddings', weddingData.id, 'guests');
      const snapshot = await getDocs(guestsRef);
      const list: Guest[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Guest, 'id'>) }));
      setGuests(list);
      const newGuestMap = new Map<string, string>();
      list.forEach(g => {
        if (g.id) newGuestMap.set(g.id, g.name);
      });
      setGuestMap(newGuestMap);
    } catch (error) {
      console.error('Error loading guests:', error);
      toast({ title: 'Error', description: 'Could not load guest list.', variant: 'destructive' });
    } finally {
      setLoadingGuests(false);
    }
  };

  useEffect(() => {
    if (weddingData?.id) {
      loadGuests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      personalMessage: '',
    });
    setEditingGuest(null);
  };

  const handleSubmit = async (values: GuestFormValues) => {
    if (!weddingData?.id || !currentUser) return;
    setSaving(true);
    try {
      let primaryGuestId = editingGuest?.id;
      const batch = writeBatch(db);

      const primaryGuestData: Partial<Guest> & { weddingId: string, updatedAt: Timestamp, createdAt?: Timestamp } = {
        ...values, 
        weddingId: weddingData.id,
        updatedAt: serverTimestamp() as Timestamp,
      };
      
      delete (primaryGuestData as any).isPlusOneFor;


      if (editingGuest && primaryGuestId) { 
        const guestRef = doc(db, 'weddings', weddingData.id, 'guests', primaryGuestId);
        batch.update(guestRef, primaryGuestData);
      } else { 
        primaryGuestData.createdAt = serverTimestamp() as Timestamp;
        const newGuestRef = doc(collection(db, 'weddings', weddingData.id, 'guests'));
        primaryGuestId = newGuestRef.id; 
        batch.set(newGuestRef, primaryGuestData);
      }

      if (primaryGuestId) {
        const plusOneQuery = query(
          collection(db, 'weddings', weddingData.id, 'guests'),
          where('isPlusOneFor', '==', primaryGuestId)
        );
        const existingPlusOnesSnapshot = await getDocs(plusOneQuery);
        const existingPlusOneDoc = existingPlusOnesSnapshot.docs.length > 0 ? existingPlusOnesSnapshot.docs[0] : null;

        if (values.plusOneAllowed && values.plusOneName) {
          const plusOneGuestData: Omit<Guest, 'id'> & { updatedAt: Timestamp, createdAt?: Timestamp } = {
            name: values.plusOneName,
            weddingId: weddingData.id,
            email: '', 
            phone: '',
            category: values.category, 
            relationship: 'plus-one',
            familyGroup: values.familyGroup || '', 
            headOfFamily: false,
            plusOneAllowed: false, 
            plusOneName: '',
            invitedTo: values.invitedTo || [], 
            invitationCode: '', 
            rsvpStatus: existingPlusOneDoc?.data().rsvpStatus || 'pending', 
            isPlusOneFor: primaryGuestId, 
            updatedAt: serverTimestamp() as Timestamp,
          };

          if (existingPlusOneDoc) {
            const plusOneRef = doc(db, 'weddings', weddingData.id, 'guests', existingPlusOneDoc.id);
            batch.update(plusOneRef, plusOneGuestData);
          } else {
            plusOneGuestData.createdAt = serverTimestamp() as Timestamp;
            const newPlusOneRef = doc(collection(db, 'weddings', weddingData.id, 'guests'));
            batch.set(newPlusOneRef, plusOneGuestData);
          }
        } else if (existingPlusOneDoc) { 
          batch.delete(doc(db, 'weddings', weddingData.id, 'guests', existingPlusOneDoc.id));
        }
      }
      
      await batch.commit();
      toast({ title: editingGuest ? 'Guest updated' : 'Guest added' });
      setDialogOpen(false);
      resetForm();
      await loadGuests();

    } catch (error: any) {
      console.error('Error saving guest:', error);
      toast({ title: 'Error Saving Guest', description: error.message || 'Could not save guest details.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guestToDelete: Guest) => {
    if (!weddingData?.id || !guestToDelete.id) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const guestRef = doc(db, 'weddings', weddingData.id, 'guests', guestToDelete.id);
      batch.delete(guestRef);

      if (!guestToDelete.isPlusOneFor) {
        const plusOneQuery = query(
          collection(db, 'weddings', weddingData.id, 'guests'),
          where('isPlusOneFor', '==', guestToDelete.id)
        );
        const plusOnesSnapshot = await getDocs(plusOneQuery);
        plusOnesSnapshot.forEach((plusOneDoc) => {
          batch.delete(doc(db, 'weddings', weddingData.id, 'guests', plusOneDoc.id));
        });
      } 
      else if (guestToDelete.isPlusOneFor) {
        const primaryGuestRef = doc(db, 'weddings', weddingData.id, 'guests', guestToDelete.isPlusOneFor);
        batch.update(primaryGuestRef, {
          plusOneAllowed: false,
          plusOneName: '', 
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast({ title: 'Guest Removed', description: `${guestToDelete.name} and any linked plus-one have been removed.` });
      await loadGuests();
    } catch (error: any) {
      console.error('Error deleting guest:', error);
      toast({ title: 'Deletion Failed', description: error.message || 'Could not remove guest.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvitation = async (guestToSend: Guest) => {
    if (!weddingData?.slug || !guestToSend.email || !guestToSend.id) {
      toast({ title: 'Missing information', description: 'Guest email or wedding details are incomplete.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const invitationLink = `${window.location.origin}/weddings/${weddingData.slug}`;
      const res = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: guestToSend.email, link: invitationLink }),
      });
      if (res.ok) {
        toast({ title: 'Invitation Sent', description: `Email sent to ${guestToSend.email}` });
        await updateDoc(doc(db, 'weddings', weddingData.id, 'guests', guestToSend.id), {
          invitationStatus: 'sent',
          updatedAt: serverTimestamp(),
        });
        await loadGuests();
      } else {
        const data = await res.json();
        toast({ title: 'Send Failed', description: data.error || 'Unable to send invitation.', variant: 'destructive' });
      }
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    toast({ title: 'Send Failed', description: error.message || 'Unable to send invitation.', variant: 'destructive' });
  } finally {
    setSending(false);
    setCurrentGuestForAction(null); // Close the confirmation dialog
  }
};

const fetchInvitationPreview = async (guestToPreview: Guest) => {
  if (!weddingData?.slug || !guestToPreview.email) {
    toast({ title: 'Missing Information', description: 'Guest email or wedding details incomplete for preview.', variant: 'destructive' });
    return;
  }
  setIsFetchingPreview(true);
  setInvitationPreviewHtml('');
  try {
    const invitationLink = `${window.location.origin}/weddings/${weddingData.slug}`;
    const res = await fetch('/api/send-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: guestToPreview.email, link: invitationLink, preview: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.html) {
        setInvitationPreviewHtml(data.html);
      } else {
        throw new Error(data.error || 'Preview HTML not found in response.');
      }
    } else {
      const data = await res.json();
      throw new Error(data.error || 'Failed to fetch preview.');
    }
  } catch (error: any) {
    console.error('Error fetching invitation preview:', error);
    setInvitationPreviewHtml(`<p class="text-destructive">Error: ${error.message}</p>`);
    toast({ title: 'Preview Failed', description: error.message, variant: 'destructive' });
  } finally {
    setIsFetchingPreview(false);
  }
};
  
  const startEdit = (guestToEdit: Guest) => {
    let targetGuestForForm = guestToEdit;
    if (guestToEdit.isPlusOneFor) {
      const primary = guests.find(g => g.id === guestToEdit.isPlusOneFor);
      if (primary) {
        targetGuestForForm = primary;
      } else {
        toast({ title: "Error", description: `Primary guest for ${guestToEdit.name} not found. Please edit the primary guest directly.`, variant: "destructive" });
        return;
      }
    }
  
    form.reset({
      name: targetGuestForForm.name || '',
      email: targetGuestForForm.email || '',
      phone: targetGuestForForm.phone || '',
      category: targetGuestForForm.category || "bride's",
      relationship: targetGuestForForm.relationship === 'plus-one' ? 'friend' : targetGuestForForm.relationship || 'friend',
      familyGroup: targetGuestForForm.familyGroup || '',
      headOfFamily: !!targetGuestForForm.headOfFamily,
      plusOneAllowed: !!targetGuestForForm.plusOneAllowed,
      plusOneName: targetGuestForForm.plusOneName || '', 
      invitedTo: targetGuestForForm.invitedTo || [],
      invitationCode: targetGuestForForm.invitationCode || '',
      rsvpStatus: targetGuestForForm.rsvpStatus || 'pending',
      personalMessage: targetGuestForForm.personalMessage || '',
    });
    setEditingGuest(targetGuestForForm); 
    setDialogOpen(true);
  };


  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const nameMatch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.isPlusOneFor && guestMap.get(guest.isPlusOneFor || '')?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let categoryMatch = filters.category === 'all' || guest.category === filters.category;
      if (guest.isPlusOneFor && filters.category !== 'all') {
         const primaryGuest = guests.find(g => g.id === guest.isPlusOneFor);
         categoryMatch = primaryGuest?.category === filters.category;
      }

      let relationshipMatch = filters.relationship === 'all' || guest.relationship === filters.relationship;
       if (guest.isPlusOneFor && filters.relationship === 'plus-one') {
        relationshipMatch = true; 
      } else if (guest.isPlusOneFor && filters.relationship !== 'all' && filters.relationship !== 'plus-one') {
        relationshipMatch = false; 
      }

      const rsvpMatch = filters.rsvpStatus === 'all' || guest.rsvpStatus === filters.rsvpStatus;

      return nameMatch && categoryMatch && relationshipMatch && rsvpMatch;
    });
  }, [guests, searchTerm, filters, guestMap]);


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
              <p className="text-muted-foreground mt-1">Manage your wedding guests and their details. Total listed: {guests.length}</p>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guests</CardTitle>
                <CardDescription>{guests.length} total individuals (including plus-ones)</CardDescription>
              </div>
              <Button onClick={() => { resetForm(); setEditingGuest(null); setDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Primary Guest
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
                  <option value="plus-one">Plus One</option>
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
                  <option value="maybe">Maybe</option>
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
                      <TableRow key={guest.id} className={guest.isPlusOneFor ? 'bg-muted/30 hover:bg-muted/50' : ''}>
                        <TableCell>
                          {guest.name}
                          {guest.isPlusOneFor && <Badge variant="outline" className="ml-2 text-xs">Plus One</Badge>}
                        </TableCell>
                        <TableCell className="capitalize">
                          {guest.isPlusOneFor ? (guests.find(g => g.id === guest.isPlusOneFor)?.category?.replace("'", '’') || '-') : (guest.category?.replace("'", '’') || '-')}
                        </TableCell>
                        <TableCell className="capitalize">
                          {guest.isPlusOneFor ? `For ${guestMap.get(guest.isPlusOneFor) || 'Primary Guest'}` : (guest.relationship || '-')}
                        </TableCell>
                        <TableCell className="capitalize">{guest.invitedTo?.join(', ').replace(/_/g, ' ') || '-'}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              guest.rsvpStatus === 'accepted'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : guest.rsvpStatus === 'declined'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : guest.rsvpStatus === 'maybe'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            }`}
                          >
                            {guest.rsvpStatus || 'pending'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button size="icon" variant="ghost" onClick={() => startEdit(guest)} disabled={saving}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit {guest.isPlusOneFor ? 'Primary Guest' : 'Guest'}</span>
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                disabled={saving || !guest.email}
                                onClick={() => {
                                  setCurrentGuestForAction(guest);
                                  fetchInvitationPreview(guest); // Fetch on open
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Preview Invitation</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Invitation Preview for {currentGuestForAction?.name}</DialogTitle>
                                <DialogDescription>
                                  This is how the invitation email will look.
                                </DialogDescription>
                              </DialogHeader>
                              {isFetchingPreview ? (
                                <div className="flex justify-center items-center h-40">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                              ) : (
                                <div 
                                  className="p-4 border rounded-md max-h-[60vh] overflow-y-auto bg-white text-black"
                                  dangerouslySetInnerHTML={{ __html: invitationPreviewHtml }} 
                                />
                              )}
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">Close</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog onOpenChange={(open) => {if (!open) setCurrentGuestForAction(null)}}>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" disabled={saving || !guest.email} onClick={() => setCurrentGuestForAction(guest)}>
                                <Mail className="h-4 w-4" />
                                <span className="sr-only">Send Invitation</span>
                              </Button>
                            </AlertDialogTrigger>
                            {currentGuestForAction?.id === guest.id && ( // Only render content if this guest is selected
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Send Invitation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Send digital invitation to {currentGuestForAction.email}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setCurrentGuestForAction(null)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => currentGuestForAction && handleSendInvitation(currentGuestForAction)} disabled={sending}>
                                    {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            )}
                          </AlertDialog>

                          <AlertDialog onOpenChange={(open) => {if (!open) setCurrentGuestForAction(null)}}>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" disabled={saving} onClick={() => setCurrentGuestForAction(guest)}>
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            {currentGuestForAction?.id === guest.id && (
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Guest</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {currentGuestForAction.name}?
                                    {!currentGuestForAction.isPlusOneFor && ' This will also remove their plus one, if any.'}
                                    {currentGuestForAction.isPlusOneFor && ' This will also update the primary guest to no longer have a plus one.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setCurrentGuestForAction(null)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => currentGuestForAction && handleDelete(currentGuestForAction)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            )}
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { resetForm(); } setDialogOpen(isOpen); }}> 
            <DialogContent className="sm:max-w-2xl md:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingGuest?.id ? 'Edit Guest' : 'Add Primary Guest'}</DialogTitle>
                <DialogDescription>
                  {editingGuest?.id ? 'Update guest information and their plus one.' : 'Enter primary guest details below.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
                    
                    <div className="md:col-span-2">
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
                    </div>
                  
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
                            <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" {...field}>
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
                            <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" {...field}>
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
                      name="headOfFamily"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm h-10">
                          <FormControl>
                             <input type="checkbox" className="h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            Head of Family
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="plusOneAllowed"
                      render={({ field }) => (
                         <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm h-10">
                          <FormControl>
                            <input type="checkbox" className="h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            Allow plus one
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {watchPlusOne && (
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="plusOneName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plus-One Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter plus one's name" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="md:col-span-2 mt-2">
                      <Separator className="my-2" />
                      <h3 className="text-base font-medium">Invitation Details</h3>
                      <p className="text-sm text-muted-foreground">Location: {weddingData?.location || '-'}</p>
                      <p className="text-sm text-muted-foreground mb-2">Date: {weddingData?.date instanceof Timestamp ? weddingData.date.toDate().toLocaleDateString() : '-'}</p>
                    </div>

                    <div className="md:col-span-2">
                       <FormField
                          control={form.control}
                          name="invitedTo"
                          render={() => (
                            <FormItem>
                              <FormLabel>Invited To Events</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 p-2 border rounded-md shadow-sm">
                                  {['ceremony', 'reception', 'welcome_dinner'].map((type) => (
                                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={form.getValues('invitedTo').includes(type)}
                                        onChange={() => {
                                          const currentInvitedTo = form.getValues('invitedTo');
                                          const newInvitedTo = currentInvitedTo.includes(type)
                                            ? currentInvitedTo.filter((t) => t !== type)
                                            : [...currentInvitedTo, type];
                                          form.setValue('invitedTo', newInvitedTo, { shouldDirty: true, shouldValidate: true });
                                        }}
                                      />
                                      <span className="capitalize text-sm font-normal">{type.replace('_', ' ')}</span>
                                    </label>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                   
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="rsvpStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RSVP Status (Primary Guest)</FormLabel>
                            <FormControl>
                              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" {...field}>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="declined">Declined</option>
                                <option value="maybe">Maybe</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="personalMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Message</FormLabel>
                            <FormControl>
                              <textarea className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" placeholder="Add a personal note (optional)" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingGuest?.id ? 'Save Changes' : 'Add Guest'}
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

    