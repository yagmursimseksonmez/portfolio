# iKeep demo video

`app.html` is a scripted re-creation of the iKeep interface that plays a short walkthrough (reveal a value,
favourite an item, add a new item, switch to dark mode). It contains **demo data only**, so it can be
published safely. `render.mjs` captures it frame by frame and writes `public/videos/ikeep-demo.mp4`.

```bash
node tools/ikeep-demo/render.mjs
```

- The animation is a pure function of time: `render(t)` in `app.html`. Edit the data in `ITEMS`/`NEW` or the
  timings in `render()`, then re-run the command.
- `assets/` holds the wordmark and the iOS keyboard, cropped from the real app (the keyboard's language
  label is painted out).
- To use a real screen recording instead, record the app with demo data only and replace the file.
