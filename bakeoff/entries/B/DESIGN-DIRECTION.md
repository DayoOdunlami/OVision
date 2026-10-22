# Design direction — Studio B

## Discover

See DISCOVERY.md. Protect the quiet prayer typography, the falling-word puzzle, forgiving input and koi feeding. Repair the global day-completion flag, inconsistent Scripture wording, six-person assumptions, obscure navigation and rolling week. Replace compulsory stone-clearing for adults. Nothing here needs a performance economy.

## Research

Sources were read on 22 October 2026; this is desk research, not a claim to have used these products. Detailed evidence and limitations are in RESEARCH-PRACTICE.md and RESEARCH-PLAY.md.

| Source | Take | Reject |
|---|---|---|
| [Lectio 365](https://lectio365.com/) | A familiar pause, Scripture, response and yielding rhythm | A publishing operation or several obligatory daily appointments |
| [Pray As You Go](https://prayasyougo.org/) | A framework that leaves room for personal prayer | An audio-led session when this brief asks for silence |
| [Practicing the Way: Solitude](https://www.practicingtheway.org/solitude) | Brief stillness and a way to take the practice away on paper | Promising transformation through app completion |
| [Godly Play Canada](https://www.godlyplay.ca/about) | Open wondering; private responses count | Mandatory sharing, writing or a correct spiritual answer |
| [Retrieval Practice](https://www.retrievalpractice.org/faq) and [EEF](https://educationendowmentfoundation.org.uk/news/retrieval-practice-a-game-of-hide-and-seek) | Low-stakes recall with cues and another attempt | Claiming reconstruction proves memorisation |
| [Monument Valley](https://ustwogames.co.uk/our-games/monument-valley/) | A composed, hand-made place and generous touch | Copying impossible architecture or making prayer a puzzle |
| [Alto's Odyssey](https://www.landandsea.games/altos-odyssey) | A consistent landscape, light and silhouette | Endless play as the default ending |
| [Humane Product Design](https://www.humanetech.com/humane-product-design) | Cooperation, stopping well, neutral return after absence | Streaks, deprivation, guilty creatures and engagement targets |
| [Biblica permissions](https://www.biblica.com/permissions/) | Small verbatim NIV collection with acknowledgement; track counts | Adding a whole translation or paid-service dependency |

## Directions explored

### 1. A living garden

One illustrated landscape is the whole interface. Stones, seeds, pond and vineyard open the daily activities. Personal growth creates more life. It could be a strong children's place, but makes navigation depend on interpreting scenery and risks turning silent prayer into a waiting room for rewards. The spiritual director rejected the coupling of devotion and visual prosperity.

### 2. A household order of prayer

One sequence, almost a pocket liturgy: pause, read, pray, respond, end. Restrained near-black type, a margin ribbon and almost no illustration. It is the strongest bedside tool, but the child designer objected that play becomes a secondary worksheet. The ambient board and season have no natural home. Too narrow for the whole brief.

### 3. A household fieldbook — chosen

**Tend. Scripture, held together.** A quiet book with three places: Today, Our garden, Our season. Today opens directly to the household's one prayer; Quietly and Together are two sittings, with different participants, of the same Scripture. The garden gives a place to rest and look back; the season is a deliberate occasional review. The children get a full physical word game without first passing an adult practice.

This keeps the silence of direction 2 and the welcome of direction 1 without forcing one interaction to do both jobs. It costs some seamless animated continuity. That is the right trade: the practice sets the pace.

## The visual and interaction system

- **Illustration:** original vector cut-paper walled garden. An olive tree, terraced ground, a curved pond, climbing foliage and small koi. Uneven paths and layered botanical shapes, restrained fine hatching. It should feel like a gardener's illustrated fieldbook, not a game map. No stock photography or clip-art icons.
- **Type:** Cormorant Garamond for large, expressive editorial headings; Literata for Scripture and prayer; DM Sans for short controls. Self-hosted fonts, including fallbacks. Large reading type, modest line length, no tiny devotional copy.
- **Palette:** oat paper, forest ink, vermilion binding, warm ochre and muted sage. Night is blue-black paper, pale oat ink and softened terracotta; no full white flash. The season changes botanical accents rather than making prayer illegible.
- **Layout:** book-like masthead and section rules; an asymmetric daily spread on tablet, a clear reading order on phone. Open sections rather than a dashboard of equal rounded cards. One strong action, then optional invitations. Marginal labels, large type and genuine whitespace carry hierarchy.
- **Motion:** the garden has at most two slow ambient movements, never behind prayer. Feeding is directly caused by a tap. Word physics is user-invoked, not ambient. Reduced motion gives static garden and stationary shuffled word pieces. No confetti, sparkle or moving labels.
- **Sound:** none. Future spoken guidance can be deliberately invoked; no audio dependency now.
- **Touch:** 44 px minimum targets for main actions. Words accept drag, tap and keyboard. Free hints, repeat play and a clear close; never a timer or score. Completion names an activity, never a virtue.
- **Prayer:** a short threshold, the exact weekly verse, original prayer for today's pair, optional wondering, Amen. Still, self-paced steps; a full-text option for reading and printing. Prayer never auto-advances.
- **Confession:** private adult prompt, asking forgiveness, possible repair, then release. No answer is stored. Optional child's one-stone metaphor names an action rather than a feeling. It is not a condition for praying or playing.
- **History:** dated sittings and participants. A cultivated garden may accompany these memories, but no plant dies and no puzzle performance is labelled spiritual growth.

## Defaults deliberately rejected

| Default | Chosen instead | Why |
|---|---|---|
| Stock cards, grey canvas, purple gradient | Oat-paper editorial spread and one garden illustration | A distinct place with an attention hierarchy |
| Inter/system headings | Cormorant display, Literata reading, DM Sans controls | Reading and navigation have different jobs |
| Dashboard of completed habits | Two invitations to the same prayer; dated sittings | Dad's Amen must not finish the children's evening |
| Streaks and fading plants | A record that waits kindly | Absence creates no debt |
| Adult metaphor presented as confession | Actual private reflection and asking forgiveness | Handling stones cannot substitute for honesty |
| Difficulty menu as an entrance fee | All words fall by default; hints available | The children's stated favourite is the default |
| Six fixed people and index-based identity | Editable household with stable IDs | The foundation must admit other households |
| Account or browser hunt | Installable local-first book | From a home-screen icon to prayer in seconds |

## House skills

**abide-direction: adapted.** Keep the attention budget, still reading, coherent light, reduced motion and hand-made physicality. Replace the detailed vine/wind implementation and fixed palette with a quieter cut-paper fieldbook. Overturn mandatory multi-step garden work and the prohibition on another art style: this is a new coherent system, not another effect on the old scene. Do not adopt sound or decorative gold.

**product-review: kept, with one correction.** Keep outcome, few decisions, one clear next action, forgiving play, persistence, phone/night checks and cutting. Do not equate recorded frequency or puzzle success with faithfulness. Every sitting is separate and nobody is behind.

## Scope decisions before code

Use a direct family board now; personal boards feeding it remain backlog. No import of legacy data. Use an eight-week rotation with Monday boundaries and the same passage on Sunday. New devices can choose a believable fictional demonstration or a minimal household setup. Full prayer, play and saved records should remain available after an online visit without a backend. A protected hosted preview is not a substitute for local browser evidence.
