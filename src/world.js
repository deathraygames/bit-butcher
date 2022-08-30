import { PlayerCharacterEntity, AnimalEntity, ItemEntity } from './entities.js';

const WORLD_SIZE = 100;

function worldInit() {
    return {
        // seed: 123,
        size: vec2(WORLD_SIZE, WORLD_SIZE),
        blocks: [],
        items: [],
        animals: [],
        species: [],
        itemTypes: {
            meat: { name: 'Meat', tileIndex: 7, quantity: 1, stack: 64, emoji: '🍖' },
            blood: { name: 'Blood', tileIndex: 6, quantity: 1, stack: 64, emoji: '🩸' },
            knife: { name: 'Butcher knife', type: 'w', tileIndex: 5, quantity: 1, stack: 8, damaging: 1, emoji: '🔪' },
            herb: { name: 'Herb', type: 'b', tileIndex: 8, quantity: 1, stack: 64, bait: 1, emoji: '🌿' },
            wine: { name: 'Blood wine', tileIndex: 13, quantity: 1, stack: 64, youth: 10, consumable: 1, emoji: '🍷' },
            meal: { name: 'Meal', tileIndex: 14, quantity: 1, stack: 8, youth: 1, consumable: 1, emoji: '🍲' },
        },
    };
}

function makeSpecies() {
    return [];
}

class WorldView {
    constructor() {
        this.world = worldInit();
        this.world.makeAnimal = (...args) => this.makeAnimal(...args);
        this.world.makeItem = (...args) => this.makeItem(...args);
        this.tiles = [];
        this.pc = 0;
        this.center = vec2();
    }

    makePc(pos = this.center.copy()) {
        const { world } = this
        this.pc = new PlayerCharacterEntity({ pos, world });
        world.animals.push(this.pc);
        return this.pc;
    }

    makeItem(itemTypeParam, posParam, dist = 0) {
        const itemType = (typeof itemTypeParam === 'string') ? this.world.itemTypes[itemTypeParam] : itemTypeParam;
        const pos = (dist) ? posParam.add( vec2(rand(-dist, dist), rand(-dist, dist)) ) : posParam.copy();
        const { world } = this;
        world.items.push(new ItemEntity({
            itemType,
            pos,
            health: 1,
            world,
        }));     
    }

    makeAnimal(pos, bioParents) {
        const { world } = this;
        world.animals.push(new AnimalEntity({
            tileIndex: 0,
            pos,
            world,
            bioParents,
        }));
    }

    init() {
        const { world } = this;
        const { size, species, animals, items } = world;
        this.center = world.size.scale(.5);
        // const pc = this.makePc();

        let i;
        for(i = 100; i--;) { species.push(makeSpecies()) }
        for(i = 20; i--;) {
            // TODO: pick a random species
            for(let q = 2; q--;) {
                this.makeAnimal(vec2(rand(WORLD_SIZE), rand(WORLD_SIZE)));
            }
        }

        const getNear =  (n) => this.center.add( vec2().setAngle(rand(2 * PI), n) );
        this.makeItem(world.itemTypes.knife, getNear(10));
        [20, WORLD_SIZE/2, rand(20, WORLD_SIZE/2)].forEach((n) =>
            this.makeItem(world.itemTypes.herb, getNear(n))
        );
        // for(i = 1; i--;) {
        //     items.push(new ItemEntity({
        //         itemType: world.itemTypes.knife,
        //         pos: near,
        //         health: 1,
        //         world,
        //     }));
        // }
        
        // this.animals.push
        
        // create tile collision and visible tile layer
        initTileCollision(size.copy());
        const groundTileLayer = new TileLayer(vec2(), size);
        const tileLayer = new TileLayer(vec2(), tileCollisionSize);
        // const charactersTileLayer = new TileLayer(vec2(), size);
        
        const pos = vec2(); // counter
        for (pos.x = size.x; pos.x--;) {
            for (pos.y = size.y; pos.y--;) {
                const r = rand(); // randSeeded?
                const rock = r > .98;
                if (rock) setTileCollisionData(pos, 1);
                const tileIndex = r > .5 ? 1 : randInt(1, 5);
                const direction = randInt(4)
                const mirror = randInt(2);
                const color = rock ? randColor() : undefined;
                const data = new TileLayerData(tileIndex, direction, mirror, color);
                groundTileLayer.setData(pos, data);
            }
        }

        // get level data from the tiles image
        // const imageLevelDataRow = 1;
        // mainContext.drawImage(tileImage, 0, 0);
        // for (pos.x = tileCollisionSize.x; pos.x--;)
        // for (pos.y = tileCollisionSize.y; pos.y--;)
        // {
        //     const data = mainContext.getImageData(pos.x, 16*(imageLevelDataRow+1)-pos.y-1, 1, 1).data;
        //     if (data[0])
        //     {
        //         setTileCollisionData(pos, 1);
        //         const tileIndex = 1;
        //         const direction = randInt(4)
        //         const mirror = randInt(2);
        //         const color = randColor();
        //         const data = new TileLayerData(tileIndex, direction, mirror, color);
        //         tileLayer.setData(pos, data);
        //     }
        // }

        // charactersTileLayer.setData(pc.pos, pc.getTileData());
        // groundTileLayer.setData(pc.pos, pc.getTileData());

        this.tiles = [groundTileLayer, tileLayer];
        this.tiles.forEach((t) => t.redraw());
    }

    // update() {
    //     // this.tiles[0].setData(pc.pos, pc.getTileData());
    // }
}

export { PlayerCharacterEntity, WorldView };