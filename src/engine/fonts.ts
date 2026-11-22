import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { STUDIO } from '../studio.config';

// The three faces live in public/fonts so rendering needs no network.
loadFont({ family: 'Bricolage Grotesque', url: staticFile('fonts/BricolageGrotesque.woff2'), weight: '600 800' });
loadFont({ family: 'Fragment Mono', url: staticFile('fonts/FragmentMono.woff2'), weight: '400' });
loadFont({ family: 'Kalam', url: staticFile('fonts/Kalam400.woff2'), weight: '400' });
loadFont({ family: 'Kalam', url: staticFile('fonts/Kalam700.woff2'), weight: '700' });
if (STUDIO.titleFont) loadFont({ family: STUDIO.titleFont.family, url: staticFile(STUDIO.titleFont.file), weight: STUDIO.titleFont.weight });

export const FONT = {
  title: STUDIO.titleFont ? STUDIO.titleFont.family : 'Bricolage Grotesque',
  ui: 'Fragment Mono',
  hand: 'Kalam',
};
