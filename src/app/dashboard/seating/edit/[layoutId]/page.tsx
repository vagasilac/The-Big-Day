
'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Trash2, LayoutGrid as LayoutGridIcon } from 'lucide-react'; // Added LayoutGridIcon
import Image from 'next/image';

import { auth, db, storage } from '@/lib/firebase-config';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

import type { VenueLayout } from '@/types/venue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils'; // Ensure cn is imported if used by FormDescription

// Helper to ensure Timestamps are converted
const ensureDateFields = (data: any): VenueLayout => {
  const convertTimestamp = (ts: any) => ts?.toDate ? ts.toDate().toISOString() : ts;
  return {
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as VenueLayout;
};


export default function EditVenueLayoutPage() {
  const params = useParams<{ layoutId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  const [layout, setLayout] = useState<VenueLayout | null>(null);
  const [layoutName, setLayoutName] = useState(''); // This is for the input field
  const [layoutDescription, setLayoutDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null); // For local preview before upload
  const [currentPreviewImageUrl, setCurrentPreviewImageUrl] = useState<string | null>(null); // Stored URL
  const [dataAiHint, setDataAiHint] = useState<string>('');


  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      if (!layoutId || !currentUserId) {
        if (!layoutId && !isLoading) setIsLoading(false); 
        return;
      }
      setIsLoading(true);
      try {
        const docRef = doc(db, 'venueLayouts', layoutId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = ensureDateFields(snap.data()) as VenueLayout;
           if (data.ownerId !== currentUserId) {
            toast({ title: 'Access Denied', description: 'You do not own this layout.', variant: 'destructive' });
            router.push('/dashboard/seating');
            return;
          }
          setLayout(data);
          setLayoutName(data.name); // Update input field state
          setLayoutDescription(data.description || '');
          setIsPublic(data.isPublic || false);
          setCurrentPreviewImageUrl(data.previewImageUrl || null);
          setPreviewImageUrl(data.previewImageUrl || null); // For display
          setDataAiHint(data.dataAiHint || '');


        } else {
          toast({ title: 'Not Found', description: 'Venue layout does not exist.', variant: 'destructive' });
          router.push('/dashboard/seating');
        }
      } catch (error: any) {
        console.error('Error fetching layout', error);
        toast({ title: 'Error', description: 'Unable to fetch layout details.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    if (layoutId && currentUserId) {
        fetchLayout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId, currentUserId, router, toast]); 


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImageFile(null);
      setPreviewImageUrl(currentPreviewImageUrl); 
    }
  };
  
  const handleRemovePreviewImage = async () => {
    let imagePathToDelete: string | null = null;

    if (previewImageFile) { 
        setPreviewImageFile(null);
        setPreviewImageUrl(currentPreviewImageUrl); 
        return;
    }
    
    if (currentPreviewImageUrl && layout?.previewImageUrl === currentPreviewImageUrl) {
        imagePathToDelete = currentPreviewImageUrl;
    }

    if (imagePathToDelete) {
        setIsUploading(true); 
        try {
            const imageStorageRef = storageRef(storage, imagePathToDelete);
            await deleteObject(imageStorageRef);
            toast({ title: 'Image Removed', description: 'Preview image removed from storage.' });
            
            const docRef = doc(db, 'venueLayouts', layoutId);
            await updateDoc(docRef, {
              previewImageUrl: '', 
              updatedAt: serverTimestamp()
            });
            setCurrentPreviewImageUrl(null);
            setPreviewImageUrl(null);
            if(layout) setLayout({...layout, previewImageUrl: undefined });

        } catch (error: any) {
            console.error("Error removing image from storage: ", error);
            if (error.code === 'storage/object-not-found') {
                 toast({ title: 'Info', description: 'Image already removed from storage or not found. Updated record.', variant: 'default' });
                 const docRef = doc(db, 'venueLayouts', layoutId);
                 await updateDoc(docRef, {
                    previewImageUrl: '',
                    updatedAt: serverTimestamp()
                });
                setCurrentPreviewImageUrl(null);
                setPreviewImageUrl(null);
                if(layout) setLayout({...layout, previewImageUrl: undefined });
            } else {
                toast({ title: 'Removal Failed', description: 'Could not remove preview image: ' + error.message, variant: 'destructive' });
            }
        } finally {
            setIsUploading(false);
        }
    } else {
        setPreviewImageUrl(null);
    }
};


  const handleSave = async () => {
    if (!layout || !layoutId || !currentUserId) {
      toast({ title: 'Error', description: 'Layout data or user session missing.', variant: 'destructive' });
      return;
    }
    if (layout.ownerId !== currentUserId) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to update this layout.', variant: 'destructive' });
      return;
    }
    if (!layoutName.trim()) { // Use layoutName (from input state) for validation
      toast({ title: 'Name Required', description: 'Please provide a layout name.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    setIsUploading(false);

    let finalImageUrl = currentPreviewImageUrl; 

    if (previewImageFile) {
      setIsUploading(true);
      try {
        const filePath = `venue_layout_previews/${currentUserId}/${layoutId}/${Date.now()}-${previewImageFile.name}`;
        const fileStorageRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, previewImageFile);

        finalImageUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => { /* Optional: update progress */ },
            (error) => reject(error),
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
        setCurrentPreviewImageUrl(finalImageUrl);
        setPreviewImageFile(null); 
        toast({ title: 'Image Uploaded', description: 'Preview image updated successfully.' });
      } catch (error: any) {
        console.error('Error uploading preview image:', error);
        toast({ title: 'Image Upload Failed', description: 'Could not upload preview image. ' + error.message, variant: 'destructive' });
        setIsUploading(false);
        setIsSaving(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else if (previewImageUrl === null && currentPreviewImageUrl !== null) {
      finalImageUrl = ''; 
    }


    try {
      const docRef = doc(db, 'venueLayouts', layoutId);
      const dataToUpdate: Partial<VenueLayout> = {
        name: layoutName.trim(), // Save the name from the input field state
        description: layoutDescription || '',
        isPublic,
        previewImageUrl: finalImageUrl || '', 
        dataAiHint: dataAiHint || '',
        updatedAt: serverTimestamp() as any, 
      };

      await updateDoc(docRef, dataToUpdate);
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-2xl text-center">
        <p className="text-xl text-muted-foreground">Venue layout not found or you don&apos;t have permission to view it.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/seating">Go back to Seating</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-3xl space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/seating">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Seating</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {`Edit Layout: ${layout ? layout.name : (isLoading ? 'Loading name...' : 'Details')}`}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isUploading}>
          {(isSaving || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Layout Configuration</CardTitle>
          <CardDescription>Update the details and preview image for this venue layout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="layout-name" className="block text-sm font-medium mb-1">
              Layout Name
            </Label>
            <Input
              id="layout-name"
              value={layoutName} // Use layoutName state for input
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="e.g., Grand Ballroom - Wedding Setup"
            />
          </div>
          <div>
            <Label htmlFor="layout-desc" className="block text-sm font-medium mb-1">
              Description (Optional)
            </Label>
            <Textarea
              id="layout-desc"
              value={layoutDescription}
              onChange={(e) => setLayoutDescription(e.target.value)}
              placeholder="Notes about this layout, capacity details, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview-image-upload" className="block text-sm font-medium">
              Preview Image (Optional)
            </Label>
            <div className="w-full max-w-xs h-40 relative bg-secondary rounded-md overflow-hidden border border-dashed flex items-center justify-center">
                {previewImageUrl ? (
                    <Image src={previewImageUrl} alt="Layout preview" layout="fill" objectFit="contain" />
                ) : (
                    <div className="text-center text-muted-foreground p-2">
                    <LayoutGridIcon className="mx-auto h-10 w-10" /> {/* Use imported icon */}
                    <p className="text-xs mt-1">No preview image.</p>
                    </div>
                )}
            </div>
            <Input
                id="preview-image-upload"
                type="file"
                accept="image/*"
                className="block w-full max-w-xs text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                onChange={handleFileChange}
                disabled={isUploading}
            />
            {previewImageUrl && (
                 <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePreviewImage}
                    className="text-destructive hover:text-destructive text-xs disabled:opacity-50"
                    disabled={isUploading || isSaving}
                >
                    <Trash2 className="mr-1.5 h-3 w-3" /> Remove Preview Image
                </Button>
            )}
             <FormDescription className="text-xs">
                Upload an image to represent this layout (e.g., a screenshot or diagram).
            </FormDescription>
          </div>
          
          <div>
            <Label htmlFor="data-ai-hint" className="block text-sm font-medium mb-1">
              Image Search Hint (Optional)
            </Label>
            <Input
              id="data-ai-hint"
              value={dataAiHint}
              onChange={(e) => setDataAiHint(e.target.value)}
              placeholder="e.g., ballroom diagram, restaurant floorplan"
            />
            <p className="text-xs text-muted-foreground mt-1">One or two keywords for AI-assisted image search if no preview is uploaded.</p>
          </div>


          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              disabled={!layout || layout.ownerId !== currentUserId}
            />
            <Label htmlFor="is-public" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Make this layout a public template
            </Label>
          </div>
           <p className="text-xs text-muted-foreground">
              Public templates can be used by other users. This is typically for venue-provided or generic layouts.
            </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-8">
        <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!layout || layout.ownerId !== currentUserId || isSaving || isUploading}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete This Layout
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        <strong> {layoutName || (layout ? layout.name : 'this layout')}</strong> and all its associated data.
                        If this layout is currently selected for any wedding, that selection will be cleared.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async () => {
                             if (!layoutId || !currentUserId || !layout || layout.ownerId !== currentUserId) return;
                            setIsSaving(true);
                            try {
                                if (layout.previewImageUrl) {
                                    try {
                                        const imageStorageRef = storageRef(storage, layout.previewImageUrl);
                                        await deleteObject(imageStorageRef);
                                    } catch (imgError: any) {
                                        console.warn("Could not delete preview image from storage:", imgError);
                                    }
                                }
                                await deleteDoc(doc(db, 'venueLayouts', layoutId));
                                toast({ title: 'Layout Deleted', description: `Layout "${layoutName || layout.name}" was successfully deleted.`});
                                router.push('/dashboard/seating');
                            } catch (error: any) {
                                toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
                                setIsSaving(false); // Ensure saving is reset on error
                            }
                            // No finally setIsSaving(false) here because router.push might unmount
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isSaving}
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, delete it
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2">
                Deleting a layout is permanent. Consider if this layout is used or might be needed in the future.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

// FormDescription component (if not globally available from ui/form)
const FormDescription = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);
