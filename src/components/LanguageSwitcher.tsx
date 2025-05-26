// src/components/LanguageSwitcher.tsx
'use client'; 

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next-intl/navigation'; // Correct import for App Router
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div className="flex items-center">
      <Select defaultValue={locale} onValueChange={onSelectChange} disabled={isPending}>
        <SelectTrigger
          aria-label={t('language')}
          className="w-auto h-9 text-xs px-2 py-1 border-none shadow-none bg-transparent hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-accent/50"
        >
          <Globe className="h-4 w-4 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder={t('language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('english')}</SelectItem>
          <SelectItem value="es">{t('spanish')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
