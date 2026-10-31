import { notFound } from 'next/navigation';
import { SignupForm } from '@/components/SignupForm';
import { CountryCodeSchema } from '@/lib/types';

const NAMES = { ID: 'Indonesia', PH: 'the Philippines', TH: 'Thailand' } as const;

export default async function SignupPage({ params }: { params: Promise<{ country: string }> }) {
  const parsed = CountryCodeSchema.safeParse((await params).country);
  if (!parsed.success) notFound();
  return (
    <main className="page narrow">
      <div className="intro">
        <h1>Get a free recipe sample</h1>
        <p>For cooks in {NAMES[parsed.data]}. Tell us what you like to cook, and we&apos;ll send you a sample recipe.</p>
      </div>
      <SignupForm country={parsed.data} />
    </main>
  );
}
