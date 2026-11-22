import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { ShotMap } from './shots';

export const besiHilang = defineEpisode('BesiHilang', {
  timeline: timeline as Timeline,
  shots: ShotMap,
  width: 1080,
  height: 1920,
  grain: true,
  vignette: true,
  bg: '#0B0816',
});
