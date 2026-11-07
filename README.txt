Each reel = src/data.json. Workflow checks it (python3 tools/build.py), makes the sound, renders out/reel.mp4.
Upload to GitHub -> Actions -> Render reel -> Artifacts -> download reel.
If the check fails, the run goes red and the log says which line/field is wrong.
Keep old parts in episodes/ for the series.
