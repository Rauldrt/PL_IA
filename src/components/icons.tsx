'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const DefaultLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
      fill="currentColor"
    >
      <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z" />
      <path d="M168 100h-3.39a8 8 0 0 0-7.85 6.28l-6.15 24.6-9-36a8 8 0 0 0-15.3-.2L112.55 129H96a8 8 0 0 0 0 16h20a8 8 0 0 0 7.85-6.28l6.15-24.6 9 36A8 8 0 0 0 144.3 158L158 115.45l7.32 29.28A8 8 0 0 0 173.15 151H192a8 8 0 0 0 0-16h-15.45Z" />
    </svg>
  );

export const Logo = (props: React.SVGProps<SVGSVGElement> & { className?: string; width?: number; height?: number }) => {
    const appLogo = PlaceHolderImages.find(p => p.id === 'app-logo');
    const logoUrl = appLogo?.imageUrl;

    const width = props.width || 48;
    const height = props.height || 48;

    if (logoUrl) {
        return (
            <div className={props.className}>
                <Image
                    src={logoUrl}
                    alt="App Logo"
                    width={Number(width)}
                    height={Number(height)}
                    className="object-contain"
                />
            </div>
        );
    }
    return <DefaultLogo {...props} width={width} height={height} />;
};
