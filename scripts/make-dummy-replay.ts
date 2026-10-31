import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getCountries } from '../lib/evidence';
import type { ReplayData } from '../lib/replay';
import { computeScore } from '../lib/score';
import type { BookTags, CountryCode, CountryFit, Evidence, TasteMatch } from '../lib/types';

// Writes a rehearsal replay so the demo runs without a Gemini key or real evidence.
// The book tags describe the real CWC Vol 25 ebook; the market evidence, scores and kit are made up
// and labelled as such. Replace this with save-replay.ts once real evidence exists.

const today = new Date().toISOString().slice(0, 10);

const book: BookTags = {
  readable: true,
  title: 'CWC Vol 25',
  cuisine: 'Malaysian home cooking, plus Indonesian, Thai, Turkish and café recipes',
  spiceLevel: 'medium',
  portion: 'family',
  cookingTime: '15–60 minutes',
  ingredientCost: 'low',
  dietaryFit: ['no pork'],
  language: 'Malay',
};

function dummy(country: CountryCode, n: number, finding: string): Evidence {
  return {
    id: `dummy-${country}-${n}`,
    country,
    sourceType: 'content',
    finding: `DUMMY: ${finding}`,
    sourceUrl: `https://example.com/dummy/${country.toLowerCase()}-${n}`,
    collectedOn: today,
  };
}

const plan: Record<CountryCode, { tasteMatch: TasteMatch; reason: string; angle: string; gaps: string[]; evidence: Evidence[] }> = {
  ID: {
    tasteMatch: 'some',
    reason: 'Dummy reason: made-up posts show interest in bakso, telur berlado and sambal, which the book covers.',
    angle: 'Dummy angle: a live cooking Ayam Masak Kicap Berempah in Indonesian.',
    gaps: ['Dummy data only. Add real Trends CSVs or screenshots.'],
    evidence: [
      dummy('ID', 1, 'Short videos of homemade bakso get many saves.'),
      dummy('ID', 2, 'Comments ask for recipes that cost little to cook.'),
      dummy('ID', 3, 'Searches for "resep rendang" rise before festive weeks.'),
      dummy('ID', 4, 'Competitor ebooks of home recipes sell at low prices.'),
      dummy('ID', 5, 'Viewers ask for Malay-language cooking lives.'),
      dummy('ID', 6, 'Telur berlado posts get many shares.'),
    ],
  },
  PH: {
    tasteMatch: 'weak',
    reason: 'Dummy reason: made-up comments mention trying new cuisines, with little detail.',
    angle: 'Dummy angle: an English-language live on one-pot meals.',
    gaps: ['Dummy data only.', 'No evidence about spice level yet.'],
    evidence: [
      dummy('PH', 1, 'Comments ask for one-pot meals for large families.'),
      dummy('PH', 2, 'Some interest in trying Malaysian dishes.'),
    ],
  },
  TH: { tasteMatch: 'none', reason: 'no evidence yet', angle: '', gaps: [], evidence: [] },
};

async function main() {
  const now = new Date();
  const countries = await getCountries();
  const fits: CountryFit[] = countries.map((c) => {
    const p = plan[c.code];
    return {
      country: c.code,
      ...computeScore({ tasteMatch: p.tasteMatch, reach: c.reach, evidence: p.evidence }, now),
      tasteMatch: p.tasteMatch,
      reason: p.reason,
      suggestedAngle: p.angle,
      gaps: p.gaps,
      evidence: p.evidence,
    };
  });

  const replay: ReplayData = {
    isDummy: true,
    capturedOn: today,
    results: [{ tags: book, fits }],
    kit: {
      country: 'ID',
      language: 'Indonesian',
      recipeTitle: 'DUMMY: Ayam Kecap Berempah (from CWC Vol 25, page 1)',
      ingredients: [
        '1 ekor ayam, sekitar 1,2 kg, potong kecil',
        '1 sdm kunyit bubuk',
        '½ gelas kecap manis',
        '1 sdt pasta asam jawa',
        '3–5 cabai rawit',
        'Bumbu halus: 2 bawang bombai, 6 bawang merah, 6 siung bawang putih, 2 cabai merah, 2 cm jahe',
        '6 tangkai daun kari dan 2 sdm bumbu kari ayam',
      ],
      steps: [
        'Lumuri ayam dengan garam dan kunyit, diamkan 10–15 menit.',
        'Goreng ayam sampai matang dan agak garing, lalu angkat.',
        'Tumis bumbu halus dan daun kari sampai harum, lalu masukkan bumbu kari sampai berminyak.',
        'Masukkan kecap manis dan asam jawa, lalu ayam goreng. Masak sampai kuah kental dan meresap.',
      ],
      swaps: [
        { from: 'kicap lemak manis', to: 'kecap manis', why: 'Dummy swap: the Indonesian sweet soy sauce sold locally.' },
        { from: 'cili padi', to: 'cabai rawit', why: 'Dummy swap: the local name for bird’s eye chilli.' },
      ],
      liveScript: 'DUMMY: Halo semua! Malam ini kita masak ayam kecap berempah dari dapur Malaysia, cocok untuk makan keluarga.',
      signupPath: '/signup/ID',
    },
  };

  await mkdir(path.join('data', 'replay'), { recursive: true });
  await writeFile(path.join('data', 'replay', 'demo.json'), JSON.stringify(replay, null, 2));
  console.log(`Saved a dummy replay: ${fits.map((f) => `${f.country} ${f.score ?? 'no evidence yet'}`).join(', ')}.`);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
