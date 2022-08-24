import { world, pc } from './world.js';
/*
    LittleJS Hello World Starter Game
*/

'use strict';

// popup errors if there are any (help diagnose issues on mobile devices)
//onerror = (...parameters)=> alert(parameters);

// game variables
let particleEmiter;

// sound effects
const clickSound = new Sound([.5,.5]);

// medals
// const medal_example = new Medal(0, 'Example Medal', 'Medal description goes here.');
// medalsInit('Hello World');

let tiles = [];

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // create tile collision and visible tile layer
    initTileCollision(vec2(32, 16));
    const groundTileLayer = new TileLayer(vec2(), world.size);
    const tileLayer = new TileLayer(vec2(), tileCollisionSize);
    const charactersTileLayer = new TileLayer(vec2(), world.size);
    
    const pos = vec2(); // counter

    for (pos.x = world.size.x; pos.x--;) {
        for (pos.y = world.size.y; pos.y--;) {
            // setTileCollisionData(pos, 1);
            const color = new Color(.5, .7, .5, .5);
            const data = new TileLayerData(1, 0, 0, color);
            groundTileLayer.setData(pos, data);
        }
    }

    // get level data from the tiles image
    const imageLevelDataRow = 1;
    mainContext.drawImage(tileImage, 0, 0);
    for (pos.x = tileCollisionSize.x; pos.x--;)
    for (pos.y = tileCollisionSize.y; pos.y--;)
    {
        const data = mainContext.getImageData(pos.x, 16*(imageLevelDataRow+1)-pos.y-1, 1, 1).data;
        if (data[0])
        {
            setTileCollisionData(pos, 1);
            const tileIndex = 1;
            const direction = randInt(4)
            const mirror = randInt(2);
            const color = randColor();
            const data = new TileLayerData(tileIndex, direction, mirror, color);
            tileLayer.setData(pos, data);
        }
    }

    charactersTileLayer.setData(pc.pos, pc.getTileData());


    tiles = [groundTileLayer, tileLayer, charactersTileLayer];
    tiles.forEach((t) => t.redraw());

    // move camera to center of collision
    cameraPos = tileCollisionSize.scale(.5);
    cameraScale = 32;

    // enable gravity
    gravity = 0; // -.01;

    // create particle emitter
    const center = tileCollisionSize.scale(.5).add(vec2(0,9));
    particleEmiter = new ParticleEmitter(
        center, 0, 1, 0, 200, PI, // pos, angle, emitSize, emitTime, emitRate, emiteCone
        0, vec2(16),                            // tileIndex, tileSize
        new Color(1,1,1),   new Color(0,0,0),   // colorStartA, colorStartB
        new Color(1,1,1,0), new Color(0,0,0,0), // colorEndA, colorEndB
        2, .2, .2, .1, .05,     // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
        .99, 1, .5, PI, .05,     // damping, angleDamping, gravityScale, particleCone, fadeRate, 
        .5, 1, 1                // randomness, collide, additive, randomColorLinear, renderOrder
    );
    particleEmiter.elasticity = .3; // bounce when it collides
    particleEmiter.trailScale = 2;  // stretch in direction of motion
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    if (mouseWasPressed(0))
    {
        // play sound when mouse is pressed
        clickSound.play(mousePos);

        // change particle color and set to fade out
        particleEmiter.colorStartA = new Color;
        particleEmiter.colorStartB = randColor();
        particleEmiter.colorEndA = particleEmiter.colorStartA.scale(1,0);
        particleEmiter.colorEndB = particleEmiter.colorStartB.scale(1,0);

        // unlock medals
        // medal_example.unlock();
    }

    // move particles to mouse location if on screen
    if (mousePosScreen.x) {
        // particleEmiter.pos = mousePos;
        // pc.pos = mousePos;
        particleEmiter.pos = pc.pos;
    }

    cameraScale = clamp(cameraScale*(1-mouseWheel/10), 1, 1e3);
    cameraPos =  cameraPos.lerp(pc.pos, 0.1);

    tiles[2].setData(pc.pos, pc.getTileData());
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{

}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // draw a grey square in the background without using webgl
    // drawRect(cameraPos, tileCollisionSize.add(vec2(5)), new Color(.2,.2,.2), 0, 0);
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // draw to overlay canvas for hud rendering
    drawTextScreen('Hello World 🦀', vec2(overlayCanvas.width/2, 80), 80, new Color, 9);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, 'tiles.png');