import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <img src="/assets/placeholder.svg" alt="D10G3N" className="hero-logo" />
      <h1>404</h1>
      <p>This page was not found.</p>
      <Link href="/" className="btn btn-primary">Back to D10G3N Live</Link>
    </main>
  );
}
