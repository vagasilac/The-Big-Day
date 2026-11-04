import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type SafeImageProps = ImageProps & { fill?: boolean };

/** next/image cannot render data: or blob: URLs used by the browser preview. */
export function SafeImage({ src, alt, className, fill, style, ...rest }: SafeImageProps) {
  const value = typeof src === 'string' ? src : '';
  const inline = value.startsWith('data:') || value.startsWith('blob:');
  if (inline) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={value}
        alt={alt}
        className={cn(className, fill && 'absolute inset-0 h-full w-full object-cover')}
        style={style}
      />
    );
  }
  return <Image src={src} alt={alt} className={className} fill={fill} style={style} {...rest} />;
}
