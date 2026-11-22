import React from 'react';
import { defineEpisode, Timeline, LookDef, HudChip } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 } from './shots';

const breatheLook: LookDef = {
  grade: (lv) => `saturate(${1 - 0.08 * lv}) hue-rotate(${8 * lv}deg) brightness(${1 + 0.05 * lv})`,
  Overlay: ({ f }) => <HudChip f={f} label="BREATHE" icon="dot" />,
};

export const tenSecondGills = defineEpisode('TenSecondGills', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 },
  looks: { breathe: breatheLook },
});
