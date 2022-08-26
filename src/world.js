import { PlayerCharacterEntity, CharacterEntity } from './entities.js';

const WORLD_SIZE = 100;

function worldInit() {
    return {
        seed: 123,
        size: vec2(WORLD_SIZE, WORLD_SIZE),
        blocks: [],
        items: [],
        animals: [],
        species: [],
    };
}

function makeSpecies() {
    return [];
}

class WorldView {
    constructor() {
        this.world = worldInit();
        this.tiles = [];
    }

    init() {
        const { world } = this;
        const { size, species, animals } = world;
        window.pc = new PlayerCharacterEntity({ pos: size.scale(.5), world });
        pc.pickup({ name: 'Butcher knife' });
        pc.pickup({ name: 'Bait' });

        animals.push(pc);

        let i;
        for(i = 100; i--;) { species.push(makeSpecies()) }
        for(i = 20; i--;) {
            // TODO: pick a random species
            for(let q = 2; q--;) {
                animals.push(new CharacterEntity({
                    tileIndex: 0,
                    pos: vec2(rand(0, WORLD_SIZE), rand(0, WORLD_SIZE)),
                    world,
                }));
            }
        }
        
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
        groundTileLayer.setData(pc.pos, pc.getTileData());

        this.tiles = [groundTileLayer, tileLayer];
        this.tiles.forEach((t) => t.redraw());
    }

    update() {
        // this.tiles[0].setData(pc.pos, pc.getTileData());
    }
}

export { PlayerCharacterEntity, WorldView };