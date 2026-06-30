
/**
 * Cinematic Scroll Engine
 * Provides programmatic, frame-perfect scroll control with custom easing.
 */

export const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export const easeInOutQuint = (t: number): number => {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
};

export interface ScrollToOptions {
  target: number;
  duration?: number;
  easing?: (t: number) => number;
  container?: HTMLElement | Window;
}

export const animateScrollTo = ({
  target,
  duration = 1000,
  easing = easeOutExpo,
  container = window,
}: ScrollToOptions): Promise<void> => {
  return new Promise((resolve) => {
    const start = container instanceof Window ? container.scrollY : (container as HTMLElement).scrollTop;
    const distance = target - start;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easedProgress = easing(progress);

      const nextPos = start + distance * easedProgress;

      if (container instanceof Window) {
        container.scrollTo(0, nextPos);
      } else {
        (container as HTMLElement).scrollTop = nextPos;
      }

      if (progress < 1) {
        requestAnimationFrame(animation);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animation);
  });
};

export const waitMs = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
