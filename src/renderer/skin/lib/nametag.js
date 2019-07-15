
export default function buildNickCartouche(text) {
    // create the canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    // center the origin
    context.translate(canvas.width / 2, canvas.height / 2);
    // measure text
    const fontSize = 20;
    context.font = `bolder ${fontSize}px Verdana`;
    const fontH = fontSize;
    const fontW = context.measureText(text).width;
    // build the background
    context.fillStyle = 'rgba(0,0,0,0.2)';
    const scale = 1.2;
    context.fillRect(-fontW * scale / 2, -fontH * scale / 1.3, fontW * scale, fontH * scale);
    // display the text
    context.fillStyle = 'rgba(0,0,0,0.7)';
    context.fillText(text, -fontW / 2, 0);
    // return the canvas element
    return canvas;
}
