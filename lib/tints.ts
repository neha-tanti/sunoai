export const TINT_CLASS = {
  sage: 'border-sage-border bg-sage text-sage-foreground',
  coral: 'border-coral-border bg-coral text-coral-foreground',
  sand: 'border-sand-border bg-sand text-sand-foreground',
  slate: 'border-slate-border bg-slate text-slate-foreground',
  lavender: 'border-lavender-border bg-lavender text-lavender-foreground',
};

export type Tint = keyof typeof TINT_CLASS;
