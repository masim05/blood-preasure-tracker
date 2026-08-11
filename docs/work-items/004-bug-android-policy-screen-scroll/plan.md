# Implementation plan

1. Refine `ProfileScreen` layout behavior so top-level scrolling applies to the profile list only.
2. Move about-page content into dedicated containers with their own scroll strategy.
3. Make policy WebView content use available screen area instead of a fixed-height card to avoid touch/scroll deadlock.
4. Keep back button and existing navigation callbacks unchanged.
5. Add/update Android UI tests around policy/about rendering paths.
6. Run targeted Android unit/UI tests for affected screen classes.
