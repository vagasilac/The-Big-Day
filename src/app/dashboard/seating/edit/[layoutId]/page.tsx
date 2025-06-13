'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

import { auth, db } from '@/lib/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { VenueLayout } from '@/types/venue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function EditVenueLayoutPage() {
  const params = useParams<{ layoutId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [layout, setLayout] = useState<VenueLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const layoutId = params.layoutId;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        router.push('/auth');
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fetchLayout = async () => {
      if (!layoutId) return;
      try {
        const docRef = doc(db, 'venueLayouts', layoutId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as VenueLayout;
          setLayout({
            ...data,
            id: snap.id,
            createdAt: (data.createdAt as any).toDate ? (data.createdAt as any).toDate().toISOString() : data.createdAt,
            updatedAt: (data.updatedAt as any).toDate ? (data.updatedAt as any).toDate().toISOString() : data.updatedAt,
          });
        } else {
          toast({ title: 'Not Found', description: 'Venue layout does not exist', variant: 'destructive' });
        }
      } catch (error: any) {
        console.error('Error fetching layout', error);
        toast({ title: 'Error', description: 'Unable to fetch layout.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLayout();
  }, [layoutId, toast]);

  const handleSave = async () => {
    if (!layout || !layoutId) return;
    if (!currentUserId || currentUserId !== layout.ownerId) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to update this layout.', variant: 'destructive' });
      return;
    }
    if (!layout.name.trim()) {
      toast({ title: 'Name Required', description: 'Please provide a layout name.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const docRef = doc(db, 'venueLayouts', layoutId);
      await updateDoc(docRef, {
        name: layout.name.trim(),
        description: layout.description || '',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Layout Updated', description: 'Changes saved successfully.' });
      router.push('/dashboard/seating');
    } catch (error: any) {
      console.error('Error updating layout', error);
      toast({ title: 'Save Failed', description: error.message || 'Failed to update layout.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="p-8 text-center space-y-4">
        <p>Venue layout not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/seating">Go back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/seating">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Venue Layout</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Layout Details</CardTitle>
          <CardDescription>Update basic information about this layout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="layout-name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <Input
              id="layout-name"
              value={layout.name}
              onChange={(e) => setLayout({ ...layout, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="layout-desc" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="layout-desc"
              value={layout.description || ''}
              onChange={(e) => setLayout({ ...layout, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

