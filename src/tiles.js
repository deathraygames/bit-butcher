const TILE_SIZE = 24;
let ctx;
let tileCount = 0;
let ri = randInt;

function getTileX() {
    return TILE_SIZE * (++tileCount);
}

const rect = (r, g, b, x, y, q, w) => {
    ctx.fillStyle = `#${r}${g}${b}`;
    ctx.fillRect(x, y, q, w);
};

function drawTerrain(r, g, b) {
    const x = getTileX(),
        y = 0;
    rect(r, g, b, x, y, TILE_SIZE, TILE_SIZE);
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

function loadTileImageSource(src = 'tiles.png') {
    return new Promise((resolve) => {
        const tileImage = new Image();
        tileImage.onload = () => {
            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
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
            ctx.font = '22px serif';
            ctx.fillText('🦀🍖🥩🍗', 0, 44);
            // ctx.fillText('🔥', 0, 22);
            resolve(canvas.toDataURL());
        };
        tileImage.src = src;
    });
}

export { loadTileImageSource };
