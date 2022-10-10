# Bit Butcher
*A small game for JS13k games 2022 competition*

Made with [LittleJS](https://github.com/KilledByAPixel/LittleJS) v1.3.8, a micro framework by the innovative [Frank Force](https://frankforce.com/). This repo started as a clone of the framework, and includes all code and examples.

[JS13k](https://js13kgames.com/) is an annual competition to make a web game in a month that fits into 13kb (13,312 bytes, minified and zipped).

## Synopsis

You're a hungry mortal in a strange world filled with other animals. But you alone know how to wield tools and know the art of butchery, so *time to get butcherin'!* Complete all the achievements to win the game.

### Controls

- Move with W,A,S,D, Arrow keys, or right click.
- Equip an item with 1-9 number keys.
- Perform an action with your equipped item with the E or X key, or left click. Each item has only one action, and includes lunging, crafting, digging, building, feeding, drinking, and eating.
- Throw a selected item from your inventory to the ground with Q or Z.
- Zoom in or out with the mouse scroll wheel.
- Reload and restart the game if you don't like the look of your character or the map (F5).

### Links

* Play the js13kgames version: https://js13kgames.com/entries/bit-butcher
* Latest `main` branch: https://deathraygames.github.io/bit-butcher/ (if there's ever any bug fixes or new features)

Final size: ~13,182-13,204 bytes (subsequent builds oddly generated different sizes each time)

## Run Locally

1. Clone the code
2. Run `npm install`
3. Run `npm run serve`
4. Open up http://192.168.1.162:8080/ in your browser

### Dev Process

5. Modify code
6. Run `npm run build`
7. Script should give the file size of the built `game.zip` - make sure it's below the js13k requirement
9. Test http://192.168.1.162:8080/build/index.html in browser (every so often the minification causes an issue)

# Postmortem

## Brainstorming, Early decisions

Coming soon (?)

- Research through existing games and frameworks
- Narrowing down ideas related to theme
- Framework selection

LittleJS has a lot to it: Object structure, super fast rendering, generative sound, music tracker, all inclusive input, physics solver, particle system, medals/achievements, etc. Learn more https://github.com/KilledByAPixel/LittleJS and https://www.youtube.com/watch?v=_dXKU0WgAj8. I made use of almost all of the features except music (I'm not a musician) and the medals/achievements -- I didn't like the way it was displayed and needed the achievements to stay on-screen as a guide to the player. Everything else worked flawlessly. It took some time getting up to speed because [the documentation](https://killedbyapixel.github.io/LittleJS/docs/) is missing many of the global variables, but I found it easy to follow along the [examples](https://github.com/deathraygames/bit-butcher/tree/main/examples) provided (especially the [platformer](https://deathraygames.github.io/bit-butcher/examples/platformer/) [code](https://github.com/deathraygames/bit-butcher/tree/main/examples/platformer)), and just read through the engine code ([engine.all.js](https://github.com/deathraygames/bit-butcher/blob/main/engine/engine.all.js)).

- Final decision on basic game: 2d top-down animal game

## Development

Coming soon (?)

- Created animal algorithm in a jsfiddle
- Butchering became the main aspect of the game
- Slowly added more features

### Build Process

Coming soon (?)

Without the build process, the code (zipped) would be around 18.7kb
