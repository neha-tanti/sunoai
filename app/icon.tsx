import { ImageResponse } from 'next/og';
import { LogoImage } from '@/components/logo-image';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<LogoImage size={size.width} />, size);
}
