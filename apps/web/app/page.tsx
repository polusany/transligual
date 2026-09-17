import Link from 'next/link';

export default function Home() {
  return <section><p className="eyebrow">TRANSLIGUAL</p><h1>French learning, built for momentum.</h1><p>Week-one MVP: browse courses, register, purchase, and learn securely.</p><div className="actions"><Link href="/login">Create an account</Link><Link href="/dashboard" className="secondary">Student dashboard</Link></div></section>;
}
