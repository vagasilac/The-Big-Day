
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next-intl/navigation'; // Changed from 'next-intl/client'
import type { ChangeEvent } from 'react';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(value: string) {
    startTransition(() => {
      router.replace(pathname, { locale: value });
    });
  }

  return (
    <Select value={locale} onValueChange={onSelectChange} disabled={isPending}>
      <SelectTrigger className="w-auto h-9 px-2.5 py-1.5 text-xs border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent hover:bg-accent/50">
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          <SelectValue placeholder={t('language')} />
        </div>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[8rem]">
        <SelectItem value="en">{t('english')}</SelectItem>
        <SelectItem value="es">{t('spanish')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
