const profiles = {
  vesper: {
    id: 'vesper',
    name: 'Vesper',
    style: 'adaptive balance',
    disclosure: 'Balanced and adaptive: watches your fold and raise rates, then shifts pressure without seeing hidden cards.',
    policy: { raiseThreshold: 0.67, raiseFraction: 0.55, bluffBoost: 0 },
    challenge: { title: 'Read the room', detail: 'Complete three hands and compare decisions with outcomes.', event: 'hand-complete', target: 3 }
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    style: 'wide pressure',
    disclosure: 'Raises more often and uses larger sizing; the challenge tracks folds under pressure without judging them as optimal.',
    policy: { raiseThreshold: 0.55, raiseFraction: 0.85, bluffBoost: 0.08 },
    challenge: { title: 'Pressure valve', detail: 'Fold twice while facing a bet. This tracks the action, not whether it was optimal.', event: 'fold-facing-bet', target: 2 }
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    style: 'patient value',
    disclosure: 'Enters fewer raising lines and sizes them smaller; pressure usually represents a narrower visible range.',
    policy: { raiseThreshold: 0.78, raiseFraction: 0.35, bluffBoost: -0.03 },
    challenge: { title: 'Break the stone', detail: 'Apply pressure with two legal raises; outcome does not determine completion.', event: 'pressure-raise', target: 2 }
  }
};

function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') deepFreeze(child);
  }
  return Object.freeze(value);
}

export const OPPONENT_PROFILES = deepFreeze(profiles);

export function createChallengeProgress(saved = {}) {
  const progress = {};
  for (const [id, profile] of Object.entries(OPPONENT_PROFILES)) {
    const value = Number.isSafeInteger(saved?.[id]) ? saved[id] : 0;
    progress[id] = Math.max(0, Math.min(profile.challenge.target, value));
  }
  return progress;
}

export function recordChallengeEvent(progress, profileId, event) {
  const profile = OPPONENT_PROFILES[profileId];
  if (!profile) throw new Error(`unknown opponent profile: ${profileId}`);
  const next = createChallengeProgress(progress);
  if (event === profile.challenge.event) {
    next[profileId] = Math.min(profile.challenge.target, next[profileId] + 1);
  }
  return next;
}

export function resetChallengeProgress() {
  return createChallengeProgress();
}
