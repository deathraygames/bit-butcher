import { WorldView } from './world.js';
import { loadTileImageSource } from './tiles.js';
/*
    LittleJS Hello World Starter Game
*/

'use strict';

// popup errors if there are any (help diagnose issues on mobile devices)
//onerror = (...parameters)=> alert(parameters);

// game variables
let particleEmiter;
const TILE_SIZE = 24; // was 16 in demo
window.TILE_SIZE = TILE_SIZE;

// sound effects
const clickSound = new Sound([.5,.5]);

// medals
// const medal_example = new Medal(0, 'Example Medal', 'Medal description goes here.');
// medalsInit('Hello World');

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    window.wv = new WorldView();
    wv.init();
    

    // move camera to center of collision
    cameraPos = tileCollisionSize.scale(.5);
    cameraScale = 42;

    // enable gravity
    gravity = 0; // -.01;

    // create particle emitter
    const emPos = vec2(10, 12);
    particleEmiter = new ParticleEmitter(
        emPos, 0, 1, 0, 200, PI, // pos, angle, emitSize, emitTime, emitRate, emiteCone
        0, vec2(TILE_SIZE),                            // tileIndex, tileSize
        new Color(1,1,1),   new Color(0,0,0),   // colorStartA, colorStartB
        new Color(1,1,1,0), new Color(0,0,0,0), // colorEndA, colorEndB
        2, .2, .2, .1, .05,     // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
        .99, 1, .5, PI, .05,     // damping, angleDamping, gravityScale, particleCone, fadeRate, 
        .5, 1, 1                // randomness, collide, additive, randomColorLinear, renderOrder
    );
    particleEmiter.elasticity = .3; // bounce when it collides
    particleEmiter.trailScale = 2;  // stretch in direction of motion


    // console.log(tileImage.src);
    // mainContext.drawImage(tileImage, 1000, 1000);
    // mainContext.fillStyle = 'green';
    // mainContext.fillRect(0, 0, 100, 100);
    // // tileImage = new Image();
    // tileImage.src = mainCanvas.toDataURL();
    
    // console.log(tileImage.src);
    // mainContext.drawImage(tileImage, 1000, 1000);
    // glInit();
    // glTileTexture = glCreateTexture(tileImage);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    if (mouseWasPressed(0))
    {
        // play sound when mouse is pressed
        clickSound.play(mousePos);

        // change particle color and set to fade out
        // particleEmiter.colorStartA = new Color;
        // particleEmiter.colorStartB = randColor();
        // particleEmiter.colorEndA = particleEmiter.colorStartA.scale(1,0);
        // particleEmiter.colorEndB = particleEmiter.colorStartB.scale(1,0);

        // unlock medals
        // medal_example.unlock();
    }

    // move particles to mouse location if on screen
    if (mousePosScreen.x) {
        // particleEmiter.pos = mousePos;
        // pc.pos = mousePos;
        // particleEmiter.pos = pc.pos;
    }

    cameraScale = clamp(cameraScale*(1-mouseWheel/10), 1, 1e3);
    cameraPos =  cameraPos.lerp(pc.pos, 0.1);

    wv.update();
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
    // drawTextScreen('Hello World 🦀', vec2(overlayCanvas.width/2, 80), 80, new Color, 9);
    const midX = overlayCanvas.width/2;
    const r = (n) => Math.round(pc.pos[n] * 10) / 10;
    drawTextScreen(`x ${r('x')}, y ${r('y')}`, vec2(midX, 80), 20, new Color, 9);
    const invText = pc.inventory
        .map((item) => item ? item.name || ' ' : ' ')
        .map((n, i) => i + ' ' + (pc.equipIndex === i ? `[ ${n.toUpperCase()} equipped ]` : `[ ${n} ]`)).join('    ') + '    0: [Hands]';
    drawTextScreen(invText, vec2(midX, overlayCanvas.height - 40), 20, new Color, 9);

}



///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
(async () => {
    tileSizeDefault = vec2(TILE_SIZE);
    const tis = await loadTileImageSource();
    engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, tis);
})();
