function cp(context, sX, sY, w, h, dX, dY, flipHorizontal) {
    const imgData = context.getImageData(sX, sY, w, h);
    if (flipHorizontal) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < (w / 2); x++) {
                const index = (x + y * w) * 4;
                const index2 = ((w - x - 1) + y * w) * 4;
                const pA1 = imgData.data[index];
                const pA2 = imgData.data[index + 1];
                const pA3 = imgData.data[index + 2];
                const pA4 = imgData.data[index + 3];

                const pB1 = imgData.data[index2];
                const pB2 = imgData.data[index2 + 1];
                const pB3 = imgData.data[index2 + 2];
                const pB4 = imgData.data[index2 + 3];

                imgData.data[index] = pB1;
                imgData.data[index + 1] = pB2;
                imgData.data[index + 2] = pB3;
                imgData.data[index + 3] = pB4;

                imgData.data[index2] = pA1;
                imgData.data[index2 + 1] = pA2;
                imgData.data[index2 + 2] = pA3;
                imgData.data[index2 + 3] = pA4;
            }
        }
    }
    context.putImageData(imgData, dX, dY);
}

export default (context, width) => {
    const scale = width / 64.0;
    const copySkin = (context, sX, sY, w, h, dX, dY, flipHorizontal) => cp(context, sX * scale, sY * scale, w * scale, h * scale, dX * scale, dY * scale, flipHorizontal);
    copySkin(context, 4, 16, 4, 4, 20, 48, true); // Top Leg
    copySkin(context, 8, 16, 4, 4, 24, 48, true); // Bottom Leg
    copySkin(context, 0, 20, 4, 12, 24, 52, true); // Outer Leg
    copySkin(context, 4, 20, 4, 12, 20, 52, true); // Front Leg
    copySkin(context, 8, 20, 4, 12, 16, 52, true); // Inner Leg
    copySkin(context, 12, 20, 4, 12, 28, 52, true); // Back Leg
    copySkin(context, 44, 16, 4, 4, 36, 48, true); // Top Arm
    copySkin(context, 48, 16, 4, 4, 40, 48, true); // Bottom Arm
    copySkin(context, 40, 20, 4, 12, 40, 52, true); // Outer Arm
    copySkin(context, 44, 20, 4, 12, 36, 52, true); // Front Arm
    copySkin(context, 48, 20, 4, 12, 32, 52, true); // Inner Arm
    copySkin(context, 52, 20, 4, 12, 44, 52, true); // Back Arm
};
