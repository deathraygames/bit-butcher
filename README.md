# Bit Butcher
***A small game for the JS13k games 2022 competition***

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

## Brainstorming & Early decisions

At the beginning of the month-long jam, I spent a good deal of time researching through existing games and frameworks, while also thinking about what type of game I wanted to make. It's useful to play some of the top games from previous years to get an idea of what the best devs are doing, and what amazing things are possible. I played probably a dozen games, and looked over all the micro frameworks I could find. One game + engine combo that I was immediately impressed by was Frank Force's [Space Huggers](https://js13kgames.com/entries/space-huggers) using his [LittleJS engine](https://github.com/KilledByAPixel/LittleJS). 

The theme of *Death* gave me several ideas for games, but too many of them felt gloomy or had too much undead. I wanted something a little cheerier, and gameplay that didn't involve violence for absolutely no reason. An initial idea I had was to make the character mortal and had a limited life, similar to [One Hour One Life](https://store.steampowered.com/app/595690/One_Hour_One_Life/) except with a shorter lifespan because game-jam games need to play fast. I had been playing [Minecraft](https://www.minecraft.net/en-us) recently (maybe you've heard of it?), and I thought having ranching would make for nice gameplay that involved some death without war. I've also always wanted to do a [Minicraft](https://playminicraft.com/) clone, so having retro graphics and a simple top-down game world seemed like a natural fit. After looking through the examples that could be done with LittleJS, I decided that I would be able to modify it to do a top-down game, and so my technology and game type were both decided.

LittleJS has a lot to it: Object structure, super fast rendering, generative sound, music tracker, all inclusive input, physics solver, particle system, medals/achievements, etc. Learn more at https://github.com/KilledByAPixel/LittleJS and https://www.youtube.com/watch?v=_dXKU0WgAj8. I used almost all of the features it offered - except music (I'm not a musician), and the medals/achievements. I didn't like the way achievements were displayed, and I needed the achievements to stay on-screen as a guide to the player. Everything else worked flawlessly. It took some time getting up to speed because [the documentation](https://killedbyapixel.github.io/LittleJS/docs/) is missing many of the global variables, but luckily it was easy to follow along the [examples](https://github.com/deathraygames/bit-butcher/tree/main/examples) provided (especially the [platformer](https://deathraygames.github.io/bit-butcher/examples/platformer/) [code](https://github.com/deathraygames/bit-butcher/tree/main/examples/platformer)), and just read through the engine code ([engine.all.js](https://github.com/deathraygames/bit-butcher/blob/main/engine/engine.all.js)). The build process was another big appeal of LittleJS. Frank Force has combined some of the best tools together to make sure the final size is as small as possible; this benefit cannot be underestimated in a competition like js13k.

## Development

When developing games for timed game jams (even month-long ones) I make a point of not planning the game out in too much detail ahead of time. I find it's fun to just *see where it goes*; you want to stay inspired and work on whatever feels fun in the moment. Also you never know where you'll get stuck. When you have limited time it's helpful to be able to quickly discard ideas/features and switch focus.

### Development Starts

After deciding on the main game theme of ranching, I knew that at a minimum I would need to have some animals. I didn't trust my pixel art skills to make realistic animals, plus I wanted to have some decent animation of them walking around without the size of a sprite sheet, so I decided I needed to turn to [procedural generation](https://www.reddit.com/r/proceduralgeneration/). I had also been playing [No Man's Sky](https://www.nomanssky.com/) recently, so I felt extra inspired to make some wild-looking, colorful procedural animals. I did a quick example in jsfiddle that drew some rectangles for heads and bodies, and some polygons for necks and legs. After a number of iterations I had a good algorithm that could not only make a random "animal" of sorts, but could also animate its legs, and rotate it in all directions. The animals looked so good that I decided to use one as the character, just "temporarily" -- but spoiler: I never made a different character graphic, the character is just another animal, albeit one that can hold weapons and tools.

To help avoid the "bulky" size of a spritesheet, I decided I would do some of the graphics using emojis. This ended up working really well for the items that the character can pick up and hold: initially just a knife 🔪, but eventually also a plant 🌿, hammer 🔨, pick ⛏, blood 🩸, and chalice. I also decided that it would be easy enough to make the terrain tile artwork procedurally too, so I made a quick algorithm that added some random squares to a background of various greens and brown, and used them as tiles. The terrain tiles are added to the map procedurally with a mix between [Voronoi areas](https://en.wikipedia.org/wiki/Voronoi_diagram) and pure randomness.

### Main Loop

As the game first came into being, it was obvious that the butchering aspect (stab, stab, stab) was the main gameplay loop. All that was needed was giving the player an inventory with a knife, and giving the animals a simple "AI" that made them notice the character and run away. LittleJS provided a satisfying blood effect without much trouble, along with some sounds using [ZzFX](https://killedbyapixel.github.io/ZzFX/). A lot of time was spent optimizing the running physics: acceleration, top speed, friction. Since moving around was 99% of the game, this really needed to "feel" right. I can't give great advice on how to do this, rather I'd just recommend spending as much time as you can spare on playing the game and tweaking values until the motion feels *just right*.  

Once this main gameplay loop was solidified, I concentrated on adding more features. I added the mortality and aging countdown early on, which gave a reason for the character to keep moving. In fact the aging ended up as the only real challenge the game offers. I'm OK with easy games in general, especially for game jams where you know players will only spend a few minutes playing your game. While the aging provided a timed challenge, I still wanted a way to counteract it in case the player wanted to continue with a longer game. This led to the ability to make *blood wine* that acted like a fountain of youth. Even though I was initially trying to avoid undead aspects in the game, I ended up throwing in a little vampirism.

Since I was drawing inspiration from Minecraft's simple animal husbandry, I added a way to breed animals in the same way: pick up their food, feed any two of them (no genders), and watch them mate. This is a nice break from the endless slaughter, and it also allowed me to have some fun with the animal generation. Parents' looks will pass on to their offspring.

### Finishing Development

For a final task, and to provide a purpose for all the carnage, I decided to have the character make a meal with all the meat they collected. It's kind of anti-climatic. But ultimately I decided that they would have to complete all the achievements before they could "win". One thing I did well in a previous entry, [404 Orbiting Asteroids](https://js13kgames.com/entries/404-orbiting-asteroids), was to teach the game via achievement checkboxes. This forced the player to learn the basics, but I would use it here to also make the player try out all the mechanics. I kept it on the screen at all times so there's never confusion about what to do next.

There were some things that I wanted to add but didn't have the time or bytes left. One feature that was dropped was making the world infinite. I had plans to create new map chunks, procedurally generated, and loaded in as you move (like Minecraft), but ultimately I decided it wasn't worth the space since there wouldn't be anything new to find in new areas. All the action could fit on one map without a problem. 

Another feature I thought up was having various *spirits* in the game: elemental entities that you would have to either work with, or avoid, or fight. Ultimately this was too convoluted, but one spirit remains: the spirit of nature is an entity that looks like a grass tile. It moves around the world and generates plants when and where it comes to rest (important since I needed a way for plants to regrow). If you look carefully you might see the spirit zip by, and if you find a patch of plants then you know who to thank.

A feature that was added late in the game was the ability to mine rocks and build stone walls. If the players could build pens for their animals, then they might feel like real ranchers, but since I never built a gate (a way for the player to get out but keep the animals in), it didn't really work well. The feature ultimately felt unnecessary to the rest of the gameplay, so I decided not to add acheivements for it. Building just exists as an optional thing to do, rather than a core part of the game.

...And that's when both the bytes and the time left both started to run out.

### Build Process

Final zip came to 13,204 bytes - dangerously close to the cut-off. Without the build process, the code (zipped) would be around 18.7kb.

## Feedback

This was probably the most positive [feedback](https://dev.js13kgames.com/games/bit-butcher) I've gotten on a game-jam game so far:

* "Smooth animations and cool generated creatures.   I found it very fun to figure out how to accomplish all of the requirements.  I never really figured out what building is for, though.  Maybe to corral the creatures?"
* "This game taught me techniques of advanced animal husbandry"
* "Funny game! :D I liked how the quests give you some hints of what to do, but also let you discover the game on your own."
* "Fun graphics, easy to understand gameplay. Good mechanics, I enjoyed butcherin'! Liked the sound effects, and all the different character sprites. Good job!"
* "Fun game. The controls have some deceleration which makes it very interesting.  I dont know what the herb is supposed to do. I like the overall palette of the game really."
* "It was really satisfying to stab the monsters. The quest bar on the right made it easy to understand what to do. The control were good, but felt slightly slippery. It's cool that we can zoom in and out. I could take a better look at the interesting monsters. I love the exclamation mark above the animals when they come near me. The game was short, meaning, I wish I could do more because it was fun. Get more tools/weapons and maybe new monsters that can also kill me."
* "Weird but really fun game. I finally was able to breed the animals at 104 years, right before I died. I did it. I really liked this one."
* "Uau! This game is amazing! From the sleek smooth graphics and animations to the sounds. I really loved it. The gameplay is simple, but not entirely obvious. But in this case, figuring out the game mechanics was half of the fun.
I feel like maybe you had more in mind for this game than you could implement. What are the pickaxe and the bricks for? At first I thought I had to build a home to be able to cook a home-cooked meal, but not. I also didn't see the point of throwing items on the ground. And there are 9 item slots but as far as I could tell there aren't 9 different items in the game.  Regardless, this was a really fun and polished game. Would be perfect with some music."
* "A fun little game. I enjoyed the running around trying to complete my tasks from the checklist. The graphics were good to see the characters from multiple angles, as were the sound effects. I didn't find a use for the bricks, I assume building, but they didn't for me. After I played to the end, I went in again for a look around rather than following the list. Discovered that the mouse wheel zooms the level which was cool - I should have read the info more thoroughly."
* "I was very impressed with how smooth the movements were and how satisfying it was when the speed of the character increased with the button press. Aside form that there was so many other great aspects to this game. The autogenerated character being one of them! I wasn't so sure about the use for some of the items in the inventory. I wonder if a quick fix could be applied here by simply adding a pop up with the use for each item." - [Ania Kubów](https://www.youtube.com/c/AniaKub%C3%B3w) (😍)
* "In Bit Butcher, you play the role of a hungry mortal. As you run around the map, you'll see it populated with both items and animals (some of which look strangely like yourself!). Pick up the knife, and when you run into one of them, blood flies everywhere which you collect. Stab them enough times, and they die, leaving you a little joint of meat. And thus, your journey continues. Collecting, using items, and stabbing your way to the end of the game. I'm not going to lie, I felt a little bad about using the love herbs to make two animals breed, only to then stab them all in order to fill up my meat quota! But that was how I needed to complete the tasks assigned to me. I picked up several items I didn't need to use to complete the game, which made me want to go back and see what they actually did. The graphics fit well, the sounds are nice and retro, and it all controlled smoothly. Dark but fun."
* "Very cool concept, took me a second to figure out what to do but after that, game becomes really enjoyable. Visual effects are smooth, it's easy to control the main character and there are plenty of things you can equip or craft. I didn't see any flaws in the current state of the game but I would love to see it expanded, with more mechanisms, this could be a really fun survival game to play. Nonetheless, congratulations on your hard work, it was a pleasure to try out this game and I hope to see more. Nice work!"

## Future

Everything is open source (MIT license), so feel free to fork it or copy any of the code. I will likely not do any more development on Bit Butcher, but will surely incorporate some of the code and design choices in future games.
