import {useEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {STUDIO} from '../../studio.config';
import {SCENES, TARGET_DURATION_SECONDS} from './sceneSpec';

export const useFriends3DFrames = () => {
  const fps = STUDIO.fps;
  const [frames, setFrames] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const handle = useRef<number | null>(null);

  if (handle.current === null) {
    handle.current = delayRender('Menghitung durasi audio Friends3D');
  }

  useEffect(() => {
    let active = true;
    const renderHandle = handle.current as number;

    Promise.all(
      SCENES.map((scene) => getAudioDurationInSeconds(staticFile(scene.audio))),
    )
      .then((durations) => {
        if (!active) return;
        const nextFrames = durations.map((duration) => Math.round(duration * fps));
        const total = nextFrames.reduce((sum, value) => sum + value, 0);
        const target = Math.round(TARGET_DURATION_SECONDS * fps);
        if (total !== target) {
          setError(
            new Error(
              `Total frame audio ${total}, diharapkan ${target}. Periksa padding VO.`,
            ),
          );
        } else {
          setFrames(nextFrames);
        }
        continueRender(renderHandle);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
        continueRender(renderHandle);
      });

    return () => {
      active = false;
    };
  }, [fps]);

  if (error) throw error;
  return frames;
};
