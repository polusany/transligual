import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = { title: 'Transligual', description: 'French learning and language services' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><main>{children}</main></body></html>;
}
