# Demo script (90 seconds)

**Setup before going on stage**
- `npm run build && npm start`, with the phone-size window open at `http://localhost:3000`.
- `GEMINI_API_KEY` and `GEMMA_MODEL` are set in `.env.local`. Without them, use the fallback below.
- Page 1 of CWC Vol 25 (Ayam Masak Kicap Berempah) is saved as an image on the laptop.
- Second tab: `/?replay=1`, ready as the backup.

---

**0:00 to 0:15. The problem**

> "This is CWC Vol 25, a real Malaysian cookbook with 30 recipes. The seller wants to sell abroad. Indonesia, the Philippines or Thailand: which one first, and what should change? Today that's a guess."

**0:15 to 0:35. Step 1: Book**

*Upload page 1. The progress line shows "Book Reader: reading the book".*

> "We give it one page. Gemma reads it: Malaysian, medium spice, family size, low cost."

**0:35 to 0:55. Step 2: Countries**

*The country cards fill in one at a time. Tap the top country.*

> "Each country gets a demand signal out of 100, not a prediction. Gemma only judges how well the book fits the evidence. Plain code calculates the score, so the same inputs always give the same result."

*Open "sources".*

> "Every score shows its sources, such as Google Year in Search and Kantar. Where we have no data, it says 'no evidence yet' instead of guessing."

**0:55 to 1:15. Step 3: Test kit**

*Tap "Create test kit". Open "Ingredient swaps".*

> "For the best market, it drafts a test kit in the local language. Here, kicap lemak manis becomes kecap manis, with a script for a live cooking session."

**1:15 to 1:30. Step 4: Share**

*Tick "I've reviewed this content". Copy and sign-up link appear.*

> "Nothing goes out until a person approves it. Then the seller shares one link, and sign-ups by country show whether the test worked. Real results replace assumptions."

---

## Fallback

| If this happens | Do this |
|---|---|
| Gemma is slow or fails | Tap **Replay saved result** in the error, or switch to the `/?replay=1` tab. Say: "This is a saved run, labelled as one." |
| No internet | Use `/?replay=1`. It runs fully offline. |
| The dummy replay is the only one available | Say clearly: "The market data here is made up for rehearsal. The banner says so." Never present dummy scores as real. |

## Likely judge questions

- **Where does the data come from?** Public sources added by the team, each with a link. Live data feeds are planned.
- **Why not just ask the AI which country?** AI guesses confidently without evidence. Here it can only use cited evidence, and the score is plain code.
- **What's next?** Score each recipe instead of the whole book, feed sign-up results back into the score, and host the sign-up page on a real database.
