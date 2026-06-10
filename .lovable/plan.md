Update the "Sign in" button in `src/components/landing/HeroSection.tsx` so it visually matches the "Create account" button (filled gold).

Change: replace the outline variant + border/ghost classes with the same classes used by Create account: `bg-secondary text-secondary-foreground hover:bg-gold-dark font-semibold text-base px-8 h-13 glow-gold`. Keep its text as "Sign in" and link to `/auth?mode=signin`.

No other files changed. No logic changes.