import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getCountries } from '../lib/evidence';
import type { ReplayData } from '../lib/replay';
import { computeScore } from '../lib/score';
import type { BookTags, CountryCode, CountryFit, Evidence, TasteMatch } from '../lib/types';

// Writes a made-up replay so the demo can be rehearsed without a Gemini key or real evidence.
// Everything here is fake and labelled as such; replace it with save-replay.ts once real evidence exists.

const today = new Date().toISOString().slice(0, 10);

const book: BookTags = {
  readable: true,
  title: 'Dummy: Malaysian Home Cooking',
  cuisine: 'Malaysian',
  spiceLevel: 'medium',
  portion: 'family',
  cookingTime: '30–45 minutes',
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
    reason: 'Dummy reason: made-up posts show interest in quick family meals with sambal.',
    angle: 'Dummy angle: a 30-minute family dinner live in Indonesian.',
    gaps: ['Dummy data only. Add real Trends CSVs or screenshots.'],
    evidence: [
      dummy('ID', 1, 'Short videos of family-size sambal recipes get many saves.'),
      dummy('ID', 2, 'Comments ask for recipes that cost little to cook.'),
      dummy('ID', 3, 'Searches for "resep rendang" rise before festive weeks.'),
      dummy('ID', 4, 'Competitor ebooks of home recipes sell at low prices.'),
      dummy('ID', 5, 'Viewers ask for Malay-language cooking lives.'),
      dummy('ID', 6, 'Posts about 30-minute dinners get many shares.'),
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
      recipeTitle: 'DUMMY: Ayam Masak Merah Keluarga',
      ingredients: ['1 ekor ayam, potong 12', '3 sdm sambal cili kering', '1 kaleng kecil saus tomat', '2 bawang bombai', 'Garam dan gula secukupnya'],
      steps: [
        'Goreng ayam sampai kecokelatan, lalu angkat.',
        'Tumis bawang bombai dan sambal sampai harum.',
        'Masukkan saus tomat, garam dan gula, lalu aduk rata.',
        'Masukkan ayam dan masak 10 menit sampai bumbu meresap.',
      ],
      swaps: [{ from: 'cili kering', to: 'cabai merah kering', why: 'Dummy swap: the local name for the same ingredient.' }],
      liveScript: 'DUMMY: Halo semua! Malam ini kita masak ayam masak merah untuk keluarga, siap dalam 30 menit.',
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
