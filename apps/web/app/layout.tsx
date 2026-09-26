import type { Metadata } from 'next';
import './styles.css';
import AppChrome from './components/app-chrome';

export const metadata: Metadata = {
  title: { default: 'Transligual | Learn French. Connect globally.', template: '%s | Transligual' },
  description: 'Learn French with expert tutors and access thoughtful translation and interpretation support.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppChrome>{children}</AppChrome></body></html>;
}
