# Design

Visual system for ASEAN Demand Radar. Product truth lives in [PRODUCT.md](PRODUCT.md).

## Direction contract: Pasar board

- **Thesis:** a demand signal read like a market stall's hand-painted price board. It refuses the cream ground, display serif or grotesk, and chili accent that AI tools default to for food products.
- **Own world:** pasar yellow ground, black boards, white boards and red for the one action. Condensed display numerals (Big Shoulders) over a plain workhorse sans (Archivo). Square-ish 3px corners, 2px black rules, no soft shadows.
- **Story:** the seller adds a book, sees which country "sells today" at a glance, opens the reasons and sources, then approves a test kit and shares it.
- **First viewport:** black header bar, the sticky 4-step bar on yellow, then the step's content in one 640px column.
- **Signature move:** the strongest country is a black board with its score in large yellow numerals, like the stall's price of the day. Weaker countries are white boards. A country with no evidence is an empty dashed frame.
- **Risk:** loud. Yellow stays on the ground and the header only. Content sits on white or black boards so long text never reads on yellow.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--ground` | `#FFD23F` | Page ground |
| `--board` | `#FFFFFF` | Content boards, inputs |
| `--ink` | `#141414` | Text, rules, black boards |
| `--ink-soft` | `#4A3A00` | Secondary text on yellow and white (≥7:1) |
| `--act` | `#C8102E` | Primary action, current step, selection outline |
| `--act-dark` | `#9E0B23` | Action hover |

- **Type:** `--font-display` Big Shoulders 700/900, uppercase, for headings and scores. `--font-body` Archivo 400/600/800 for everything else. Numbers are tabular.
- **Rules:** 2px `--ink` borders on boards and inputs, 3px radius, a dashed border for "empty" or "not checked".
- **States:** errors are a red board with white text. Dummy, sample and replay labels are a white board with a 2px ink border. Never put small red text on yellow.
