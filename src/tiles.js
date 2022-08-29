const TILE_SIZE = window.TILE_SIZE || 24;
let ctx;
let tileCount = 0;
let ri = randInt;

function getTileX() {
    return TILE_SIZE * (++tileCount);
}

const rect = (r, g, b, x, y, q = TILE_SIZE, w = TILE_SIZE) => {
    ctx.fillStyle = `#${r}${g}${b}`;
    ctx.fillRect(x, y, q, w);
};

function drawTerrain(r, g, b) {
    const x = getTileX(),
        y = 0;
    rect(r, g, b, x, y);
    [6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1].forEach((n) => {
        rect(
            ri(r, 6),
            ri(g, 6),
            ri(b, 6),
            x + ri(TILE_SIZE - n),
            y + ri(TILE_SIZE - n),
            n,
            n,
        );
    });
}

function drawTiles(doc) {
    const canvas = doc.createElement('canvas');
    doc.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    canvas.style = styleCanvas;
    ctx.drawImage(tileImage, 1000, 1000);
    rect('f', 0, 0, 0, 0, 12, 12);
    rect('f', 'f', 0, 12, 12, 12, 12);
    drawTerrain(2, 4, 3);
    drawTerrain(2, 4, 2);
    drawTerrain(3, 4, 3);
    drawTerrain(4, 3, 3);
    ctx.fillStyle = '#fff';
    ctx.font = '20px serif';
    const x = getTileX();
    // rect(3, 3, 3, x, 0);
    ctx.fillText('🔪🩸🍖', x - 1, 19);
    // Test
    ctx.fillText('🦀🍖🥩🍗💀🔪', 0, 44);
    // ctx.fillText('🔥', 0, 22);
    return canvas.toDataURL();
}

function loadTileImageSource(src) {
    return new Promise((resolve) => {
        const t = new Image(); // The tile image
        t.onload = () => resolve(drawTiles(document));
        if (src) t.src = src;
        else t.onload();
    });
}

export { loadTileImageSource };
