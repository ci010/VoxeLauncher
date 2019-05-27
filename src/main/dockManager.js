import { app, nativeImage } from 'electron';

app.once('ready', () => {
    if (app.dock) {
        const dock = app.dock;
        const img = nativeImage.createFromPath(`${__static}/apple-touch-icon.png`);
        dock.setIcon(img);
    }
});
