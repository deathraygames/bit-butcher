class WorldEntity extends EngineObject {
    constructor(pos = vec2(), size = 10, tileIndex = 0, tileSize = 10, angle = 0) {
        super(pos, size, tileIndex, tileSize, angle);
    }

    getTileData() {
        const tileIndex = 1;
        const direction = randInt(4)
        const mirror = randInt(2);
        const color = randColor();
        return new TileLayerData(tileIndex, direction, mirror, color);        
    }

    update() { // from platformer Player extends Character
        // player controls
        this.holdingJump   = keyIsDown(38) || gamepadIsDown(0);
        this.holdingShoot  = mouseIsDown(0) || keyIsDown(90) || gamepadIsDown(2);
        this.pressingThrow = mouseIsDown(1) || keyIsDown(67) || gamepadIsDown(1);
        this.pressedDodge  = mouseIsDown(2) || keyIsDown(88) || gamepadIsDown(3);

        // movement control
        this.moveInput = isUsingGamepad ? gamepadStick(0) : 
            vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));

        if (this.moveInput) {
            this.pos = this.pos.add(this.moveInput.scale(.12));
        }

        super.update();
    }
}

function worldInit() {
    return {
        seed: 123,
        size: vec2(100, 100),
    };
}

const pc = new WorldEntity();
const world = worldInit();
export { pc, world };