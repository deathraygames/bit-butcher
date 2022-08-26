/** A WorldEntity is a generic "thing" that exists in the world */
class WorldEntity extends EngineObject {
    constructor(entOptions = {}) {
        const {
            pos = vec2(),
            size = vec2(1),
            tileIndex = 1,
            tileSize,
            angle,
            world,
        } = entOptions;
        super(pos, size, tileIndex, tileSize, angle);
        this.world = world;
        this.facing = PI; // Radians: 0 = up, PI = down
        // 0 = up, 1 = right-up, 2 = right, 3 = right-down, 4 = down, 5 = left-down, 6 = left, 7 = left-up
        this.drawSize = vec2(1);
        // this.tileIndex = 1;
    }

    getTileData() {
        const direction = randInt(4)
        const mirror = randInt(2);
        const color = randColor();
        return new TileLayerData(this.tileIndex, direction, mirror, color);        
    }
}

class CharacterEntity extends WorldEntity {
    constructor(entOptions) {
        super(entOptions);
        // From platformer's Character extends GameObject 
        // this.groundTimer        = new Timer;
        // this.jumpTimer          = new Timer;
        // this.pressedJumpTimer   = new Timer;
        // this.dodgeTimer         = new Timer;
        // this.dodgeRechargeTimer = new Timer;
        // this.deadTimer          = new Timer;
        // this.grendeThrowTimer   = new Timer;
        this.actionTimer = new Timer;
        this.lookTimer = new Timer;
        this.planTimer = new Timer(rand(10));
        this.fearTimer = new Timer;
        // this.drawSize = vec2(1);
        this.color = (new Color).setHSLA(rand(),1,.7);
        this.renderOrder = 10;
        this.walkCyclePercent = 0;
        this.health = 1;
        this.maxSpeed = .1;
        this.lookRange = 7;
        this.moveInput = vec2();
        this.setCollision(1);
        // New
        this.max = vec2(TILE_SIZE);
        // this.head = vec2(12 + randInt(12), 12 + randInt(4));
        // this.body = vec2(12 + randInt(12), 12 + randInt(4));
        this.head = vec2(0.5, 0.3);
        this.body = vec2(0.6, 0.3);
        this.legs = [
            // hip, knee, foot
            [vec2(-.2, -.1), vec2(-.3, -.3), vec2(-.2, -.5)],
            [vec2(.2, -.1), vec2(.3, -.3), vec2(.2, -.5)],
        ];
        this.drawScale = this.drawSize.x / this.size.x;
        this.inventory = [,,,,,,,,,,];
        this.equipIndex = -1;
        this.walkTarget = null; // vec2();
    }

    plan() {
        if (this.planTimer.active()) return;
        this.planTimer.set(rand(2, 20));
        const worldCenter = this.world.size.scale(.5);
        const base = (this.pos.distance(worldCenter) > 30) ? worldCenter : this.pos; // set 30 based on world size
        this.walkTarget = base.add(vec2(rand(-10, 10), rand(-10, 10)));
        if (this.isPlayer) console.log('target', this.walkTarget);
    }

    look() {
        if (this.isPlayer || this.lookTimer.active()) return;
        const pc = this.world.animals.find((a) => a.isPlayer);
        if (!pc) return;
        const dist = pc.pos.distance(this.pos);
        if (dist > this.lookRange) return; // player is out of sight/smell
        const FEAR_DIST = 6;
        const fear = dist < FEAR_DIST;
        this.lookTimer.set(fear ? .5 : rand(.5, 2));
        if (fear) {
            const goto = this.pos.subtract(pc.pos).normalize(FEAR_DIST + 1);
            this.walkTarget = this.pos.add(goto);
            // console.log('Ahhh!', this.pos, pc.pos, goto);
        }
    }

    update() {
        const moveInput = this.moveInput.copy();
        const isMoveInput = (moveInput.x || moveInput.y);
        if (isMoveInput) { // "un-plan"
            this.planTimer.set(60);
            this.walkTarget = null;
        }
        this.look();
        this.plan();
        if (this.walkTarget && !isMoveInput) {
            const dist = this.pos.distance(this.walkTarget);
            if (dist > 2)
                this.velocity = this.velocity.lerp(this.walkTarget.subtract(this.pos), 0.5);
        }
        
        // apply movement acceleration and clamp
        const runInput = moveInput.scale(.04);
        
        const friction = vec2(1);
        if (moveInput.x === 0) friction.x = 0.9;
        if (moveInput.y === 0) friction.y = 0.9;
        this.velocity = this.velocity.add(runInput).multiply(friction);
        this.velocity.x = clamp(this.velocity.x, -this.maxSpeed, this.maxSpeed);
        this.velocity.y = clamp(this.velocity.y, -this.maxSpeed, this.maxSpeed);

        const speed = this.velocity.length();
        this.walkCyclePercent += speed * .5;
        this.walkCyclePercent = speed > .01 ? mod(this.walkCyclePercent) : 0;
        // Facing
        this.facing = this.velocity.angle();
        // call parent and update physics
        super.update();
    }

    render() {
        // console.log('render', this);
        let bodyPos = this.pos;
        // if (!this.isDead()) {
        //     // bounce pos with walk cycle
        bodyPos = bodyPos.add(vec2(0,.05*Math.sin(this.walkCyclePercent*PI)));
        //     // make bottom flush
        //     bodyPos = bodyPos.add(vec2(0,(this.drawSize.y-this.size.y)/2));
        // }
        // drawTile(bodyPos, this.drawSize, this.tileIndex, this.tileSize, this.color, this.angle, this.mirror);
        
        drawRect(bodyPos, this.size.scale(this.drawScale), new Color(.3, .3, .3, .4), this.angle);
        // drawRect(bodyPos.add(vec2(0, .5)), this.head.scale(this.drawScale), this.color, this.angle);
        
        drawRect(bodyPos.add(vec2(0, 0)), this.body, this.color, this.angle);
        drawRect(bodyPos.add(vec2(0, .3)), this.head, this.color, this.angle);
        this.legs.forEach((leg, li) => {
            // console.log(this.walkCyclePercent);
            // TODO: Fix this walking animation
            const liftPercent = Math.sin((this.walkCyclePercent + (.1 * li)) * PI); 
            const lift = vec2(0, .2 * liftPercent);
            leg.forEach((legSegment, i) => {
                if (!i) return; // skip first point
                drawLine(
                    bodyPos.add(leg[i - 1]).add(lift),
                    bodyPos.add(legSegment).add(lift),
                    .1,
                    this.color, 
                );
            });
        });
        // Eyes
        drawRect(bodyPos.add(vec2(-.1, .3)), vec2(.1), new Color(0, 0, 0));
        drawRect(bodyPos.add(vec2(.1, .3)), vec2(.1), new Color(0, 0, 0));
        drawRect(bodyPos, vec2(.05, .2), new Color(1, 1, 0, .5), this.facing); // Center dot
    }

    pickup(item, invIndex) {
        if (typeof invIndex !== 'number') {
            invIndex = this.inventory.findIndex((item, i) => (!item && i > 0));
        }
        if (!item || invIndex < 1 || invIndex > 9) return false;
        if (this.inventory[invIndex]) return false;
        this.inventory[invIndex] = item;
        return true;
    }

    throw() {
        // TODO
    }

    equip(invIndex) {
        if (invIndex < -1 || invIndex > 9) return false;
        this.equipIndex = invIndex;
    }

    action() {
        if (this.actionTimer.active()) return;
        const s = new Sound([.5,.5]);
        s.play(this.pos);
        this.actionTimer.set(.25);
    }
}

class PlayerCharacterEntity extends CharacterEntity {
    constructor(entOptions) {
        super(entOptions);
        this.maxSpeed = .2;
    }

    update() { // from platformer Player extends Character
        // player controls
        this.holdingJump   = keyIsDown(38) || gamepadIsDown(0);
        this.holdingShoot  = mouseIsDown(0) || keyIsDown(90) || gamepadIsDown(2);
        this.pressingThrow = mouseIsDown(1) || keyIsDown(67) || gamepadIsDown(1);
        this.pressedDodge  = mouseIsDown(2) || keyIsDown(88) || gamepadIsDown(3);
        const numKeyCodes = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
        numKeyCodes.forEach((n) => { if (keyIsDown(n)) this.equip(n - 48); });

        if (keyIsDown(81)) this.throw();
        if (keyIsDown(69)) this.action();

        // movement control
        this.moveInput = isUsingGamepad ? gamepadStick(0) : 
            vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));

        if (this.moveInput) {
            // this.pos = this.pos.add(this.moveInput.scale(.12));
        }
        this.isPlayer = true;

        super.update();
    }
}

class AnimalEntity extends CharacterEntity {

}

export { PlayerCharacterEntity, CharacterEntity, AnimalEntity }