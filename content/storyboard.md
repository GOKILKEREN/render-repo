# Storyboard: What if iron disappears?

Canvas: 1080 x 1920 px, 30 fps.
YouTube Shorts safe rectangle: left 80, right 930, top 150, bottom 1620.
Rule: every caption, hero object, and important character stays inside x 80..930 and y 150..1620. Background texture may bleed to the canvas edges.

## Safe zone contract

- Top 150 px is UI reserved, no text and no hero objects.
- Bottom 300 px is UI reserved, no text and no hero objects.
- Right 150 px is UI reserved, no text and no hero objects.
- Primary text anchor: x 90, width 820, y 260 for day titles and y 1100 for supporting lines.
- Maximum 14 words per text card.
- Each shot has at least one moving element, no static frame longer than 0.8 seconds.

## Shot list

| Shot | Time | Day | Visual | Text | Safe placement | Transition SFX |
|---|---|---|---|---|---|---|
| S01 | 0.0-2.5 | Hook | Cream paper fills screen. A single red iron atom pulses in center. | WHAT IF IRON DISAPPEARED? | x 90..900, y 300..720 | tick on frame 0 |
| S02 | 2.5-8.0 | Hook | Atom splits into dust. Train silhouette freezes mid rail. | NO IRON. NO STEEL. | x 90..900, y 420..760 | metallic snap and short whoosh |
| S03 | 8.0-15.0 | Day 1 | Bridge loses its steel bones and folds downward. | DAY 1: THE WORLD FALLS | x 90..900, y 260..460 | deep thud |
| S04 | 15.0-22.0 | Day 1 | Cars become hollow outlines. Power lines drop. | THE MODERN WORLD FALLS APART | x 90..900, y 1080..1260 | power down |
| S05 | 22.0-32.0 | Day 1 | Red blood cell loses its iron core. Blue oxygen dots drift away. | OXYGEN HAS NO RIDE | x 90..900, y 1080..1280 | soft whoosh |
| S06 | 32.0-43.0 | Day 7 | Tractor becomes a pile of useless parts. Plow vanishes. | DAY 7: FARMS STOP | x 90..900, y 260..460 | tool click |
| S07 | 43.0-58.0 | Day 30 | Supermarket shelves drain empty in three quick wipes. | EMPTY BY DAY 30 | x 90..900, y 260..460 | shelf swish |
| S08 | 58.0-70.0 | Day 30 | Hospital corridor crowded with paper silhouettes. Steel tools are missing. | NO STEEL. NO SURGERY. | x 90..900, y 260..500 | muted click |
| S09 | 70.0-88.0 | Day 90 | City blocks bend into ruins. People carry wooden wheels and stone knives. | DAY 90: WE GO BACKWARD | x 90..900, y 260..500 | time whoosh and stone knock |
| S10 | 88.0-104.0 | Day 365 | Small village rises beside broken towers. Fire glows. | DAY 365: A NEW WORLD | x 90..900, y 260..500 | soft chime |
| S11 | 104.0-128.0 | Day 365 | Child shapes a branch into a bow. Adult strikes flint. Roots and clay pots appear. | SURVIVAL IS SLOWER, CLOSER TO THE GROUND | x 90..900, y 1080..1320 | fire crackle |
| S12 | 128.0-150.0 | Reveal | Camera pulls up from village to night sky, then into a red blood cell and a distant star. | IRON WAS ALWAYS IN US | x 90..900, y 300..620 | star tick, final chime |

## Per shot motion notes

- S01 to S05: fast push in, shake on impact, paper flecks fall inside safe area.
- S06 to S08: lateral wipes with tool silhouettes, no small text, levels shift colder.
- S09 to S11: slower camera drift, warmer palette, hand drawn texture grows heavier.
- S12: upward pull, star field appears, final card holds at least 3 seconds.

## Visual QA

- All text boxes use a backing plate with alpha 0.82 for legibility.
- No text enters the right 150 px or bottom 300 px UI zones.
- Hero scale always at least 140 px height on 1080x1920.
- No random flicker that breaks deterministic rendering.
