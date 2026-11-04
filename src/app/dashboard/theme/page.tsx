'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Loader2, Palette, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-config';
import { doc, serverTimestamp, updateDoc } from '@/lib/backend/firestore';
import { useMyWedding } from '@/lib/use-my-wedding';
import { ACCENT_PRESETS, WEDDING_TEMPLATES } from '@/lib/wedding-options';
import { cn } from '@/lib/utils';

export default function ThemeAndStylePage() {
  const { wedding, loading, reload } = useMyWedding();
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState('classic-elegance');
  const [accent, setAccent] = useState(ACCENT_PRESETS[0].value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!wedding) return;
    setTemplateId(wedding.templateId || 'classic-elegance');
    setAccent(wedding.accentColor || ACCENT_PRESETS[0].value);
  }, [wedding]);

  const save = async () => {
    if (!wedding?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'weddings', wedding.id), {
        templateId,
        accentColor: accent,
        updatedAt: serverTimestamp(),
      });
      await reload();
      toast({ title: 'Theme saved', description: 'Open your wedding site to see it.' });
    } catch (error) {
      toast({ title: 'Could not save theme', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  if (!wedding) {
    return (
      <Card className="border-dashed border-2 p-8 text-center">
        <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <CardTitle className="mb-2">No Wedding Site Yet</CardTitle>
        <CardDescription className="mb-6">Create your wedding site before choosing a theme.</CardDescription>
        <Button asChild>
          <Link href="/dashboard/details"><PlusCircle className="mr-2 h-4 w-4" />Create Your Wedding Site</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Palette className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Theme & Style</h1>
          <p className="text-muted-foreground mt-1">Choose a template and an accent color for the public site.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
          <CardDescription>The same three templates from the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {WEDDING_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setTemplateId(template.id)}
              className={cn(
                'text-left rounded-lg border p-4',
                templateId === template.id && 'border-primary ring-2 ring-primary',
              )}
            >
              <p className="font-medium">{template.name}</p>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accent color</CardTitle>
          <CardDescription>Used for buttons and headings on your wedding website.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setAccent(preset.value)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-2 text-sm',
                accent === preset.value && 'ring-2 ring-offset-2 ring-primary',
              )}
            >
              <span className="h-5 w-5 rounded-full border" style={{ backgroundColor: `hsl(${preset.value})` }} />
              {preset.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="self-start">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save theme
      </Button>
    </div>
  );
}
