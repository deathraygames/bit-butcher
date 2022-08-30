import { playSound } from './sounds.js';
import { achievements } from './achievements.js';
import { getSpecies, drawSpecies, breedSpecies } from './species.js';

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
            damaging = 0,
            name = randInt(999),
            health = 0,
        } = entOptions;
        super(pos, size, tileIndex, tileSize, angle);
        this.name = name;
        this.world = world;
        this.facing = PI; // Radians: 0 = up, PI = down
        this.direction = 4; // 0-7
        this.damageTimer = new Timer;
        this.health = health;
        this.damaging = damaging;
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

    setDirection() {
        this.direction = Math.round(
            (this.facing < 0) ? 4 + ((PI + this.facing) * 4 / PI) : (this.facing * 4 / PI)
        ) % 8;
    }

    damage(damage, damagingObject) {
        ASSERT(damage >= 0);
        if (this.isDead()) return 0;
        if (this.damageTimer.active()) return 0;

        // set damage timer;
        this.damageTimer.set(1);
        for (const child of this.children)
            child.damageTimer && child.damageTimer.set(1);
        // apply damage and kill if necessary
        const newHealth = max(this.health - damage, 0);
        const amountDamaged = this.health - newHealth;
        this.health = newHealth;
        if (!this.health) this.kill(damagingObject);
        return amountDamaged;
    }

    isDead() { return !this.health; }
    kill() { this.destroy(); }

    update() {
        super.update();
        this.setDirection();

        // flash white when damaged
        if (!this.isDead() && this.damageTimer.isSet()) {
            const a = .5*percent(this.damageTimer.get(), .15, 0);
            this.additiveColor = new Color(a,.1,.1,.5);
        } else this.additiveColor = new Color(0,0,0,0);
    }

    findPc() {
        return this.world.animals.find((a) => a.isPlayerCharacter && !a.isDead());
    }
}

class CharacterEntity extends WorldEntity {
    constructor(entOptions) {
        super(entOptions);
        this.actionTimer = new Timer;
        this.lookTimer = new Timer;
        this.planTimer = new Timer(rand(10));
        this.agingTimer = new Timer;
        this.bleedTimer = new Timer;
        // Emotions
        this.emotionKey = null;
        this.estrousTimer = new Timer; // "in heat"?
        this.fearTimer = new Timer;
        // Fixed values
        this.color = (new Color).setHSLA(rand(),1,.7);
        this.bioParents = entOptions.bioParents || null;
        this.species = entOptions.species || breedSpecies(this.bioParents) || getSpecies(this.color);
        this.renderOrder = 10;
        this.health = 2; // TODO: 4?
        this.maxSpeed = .14;
        this.lookRange = 7;
        this.oldAge = Infinity;
        this.timid = false;
        this.followsBait = false;
        this.setCollision(1);
        // Changeable / temp values
        this.age = 0;
        this.walkTick = 0;
        this.walkCyclePercent = 0;
        this.urgency = 1;
        this.movementVelocity = vec2();
        this.moveInput = vec2();
        // New
        this.max = vec2(window.TILE_SIZE);
        // this.head = vec2(12 + randInt(12), 12 + randInt(4));
        // this.body = vec2(12 + randInt(12), 12 + randInt(4));
        // this.head = vec2(0.5, 0.3);
        // this.body = vec2(0.6, 0.3);
        // this.legs = [
        //     // hip, knee, foot
        //     [vec2(-.2, -.1), vec2(-.3, -.3), vec2(-.2, -.5)],
        //     [vec2(.2, -.1), vec2(.3, -.3), vec2(.2, -.5)],
        // ];
        this.drawScale = this.drawSize.x / this.size.x;
        this.inventory = [,,,,,,,,,,];
        this.equipIndex = -1;
        this.equippedEntity = null;
        this.walkTarget = null; // vec2();

        this.addChild(this.emotionEntity = new WorldEntity({ tileIndex: 9 }));
        this.emotionEntity.localPos = vec2(0, 1.2);
        this.setEmotion();

        this.addChild(this.bloodEmitter = new ParticleEmitter(
            vec2(), 0, 0, 0, 0, PI,  // pos, angle, emitSize, emitTime, emitRate, emiteCone
            undefined, undefined, // tileIndex, tileSize
            new Color(1,.2,.2), new Color(.5,.1,.1), // colorStartA, colorStartB
            new Color(.4,.1,.1), new Color(.4,.2,.2,.3), // colorEndA, colorEndB
            5, .2, .1, .07, .1, // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
            .95, .95, 1, PI, .01,    // damping, angleDamping, gravityScale, particleCone, fadeRate, 
            .2, 1              // randomness, collide, additive, randomColorLinear, renderOrder
        ), vec2(), 0);
        this.bloodEmitter.elasticity = .5;
        // this.bloodEmitter.particleDestroyCallback = persistentParticleDestroyCallback;
    }

    setEmotion(emotionKey) {
        const emotionTiles = { estrous: 9, fear: 10, anger: 11, dead: 12 };
        this.emotionEntity.drawSize = vec2(emotionKey ? 1 : 0);
        if (!emotionKey) return;
        this.emotionEntity.tileIndex = emotionTiles[emotionKey];
    }

    updateEmotion() {
        if (this.isDead()) this.emotionKey = 'dead';
        else {
            const estrous = -1 * this.estrousTimer.get();
            const fear = -1 * this.fearTimer.get();
            if (estrous > 0 && estrous > fear) this.emotionKey = 'estrous';
            else if (fear > 0) this.emotionKey = 'fear';
            else this.emotionKey = null;
        }
        this.setEmotion(this.emotionKey);
    }

    damage(damage, damagingObject) {
        const actualDmg = super.damage(damage, damagingObject);
        if (actualDmg <= 0) return 0;
        playSound('hit', this.pos);
        if (damagingObject && damagingObject.pos) {
            this.velocity = this.velocity.add(this.pos.subtract(damagingObject.pos).scale(rand(.4, .8)));
        }
        this.bleed();
        this.lookTimer.unset();
        return actualDmg;
    }

    bleed() {
        if (this.bleedTimer.active()) return;
        this.bleedTimer.set(this.isDead() ? .5 : .2);
        this.bloodEmitter.emitRate = 100;
    }

    clot() {
        if (!this.bleedTimer.active()) this.bloodEmitter.emitRate = 0;
    }

    findOpenInventoryIndex(itemName) {
        // Look for open slots with the same name and stackable - Don't consider index 0 (empty hands)
        const invIndex = this.inventory.findIndex((item, i) => (
            item && item.name === itemName && ((item.quantity || 0) < (item.stack || 0)) && i > 0
        ));
        if (invIndex !== -1) return invIndex;
        // Look for empty slots
        return this.inventory.findIndex((item, i) => (!item && i > 0));
    }

    findInventoryItem(name) {
        const i = this.inventory.findIndex((item, i) => (item && item.name === name));
        return (i < 0) ? null : this.inventory[i];
    }

    getEquippedItem() {
        return this.inventory[this.equipIndex];
    }

    pickup(item, invIndex) {
        if (typeof invIndex !== 'number') {
            invIndex = this.findOpenInventoryIndex(item.name);
        }
        if (!item || invIndex < 1 || invIndex > 9) return false;
        const existingItem = this.inventory[invIndex];
        if (existingItem && existingItem.name === item.name && ((existingItem.quantity || 0) < (existingItem.stack || 0))) {
            existingItem.quantity = (existingItem.quantity || 0) + 1;
        } else {
            this.inventory[invIndex] = item;
        }
        playSound('pickup', this.pos);
        return true;
    }

    throw() {
        // TODO
    }

    equip(invIndex) {
        if (invIndex < -1 || invIndex > 9) return false;
        this.equipIndex = invIndex;
        const item = this.inventory[this.equipIndex];
        if (!item) {
            this.equippedEntity = null;
            return;
        }
        if (item.name === 'Butcher knife') achievements.award(1);
        // if (this.equippedEntity) this.equippedEntity.destroy();
        if (this.equippedEntity) this.equippedEntity.drawSize = vec2();
        if (!item.entity) {
            item.entity = new WorldEntity(item);
            this.addChild(item.entity, vec2(-.2, .2));
        }
        this.equippedEntity = item.entity;
    }

    hasBaitEquipped() {
        const item = this.getEquippedItem();
        if (!item) return; // creature is not holding item
        return item.bait || 0;
    }

    attack() {
        // const s = new Sound([.5,.5]);
        // s.play(this.pos);
        playSound('attack', this.pos);
        // this.damage(1);
    }

    getNearest(things = [], targetPos) {
        let nearest;
        const bestDistance = things.reduce((best, a) => {
            const dist = a.pos.distance(targetPos);
            if (dist < best) {
                nearest = a;
                return dist;
            }
            return best;
        }, Infinity);
        return nearest;
    }

    findNearestAnimal(nearestPos = this.pos) {
        const aliveAnimals = this.world.animals.filter((a) => !a.isDead() && a !== this);
        const ee = this.equippedEntity;
        const interactingAnimals = aliveAnimals.filter((a) => isOverlapping(a.pos, a.size, ee.pos, ee.size));
        return this.getNearest(interactingAnimals, nearestPos);
    }

    feedNearest(nearestPos = this.pos) {
        const nearestAnimal = this.findNearestAnimal(nearestPos);
        if (!nearestAnimal) return;
        nearestAnimal.health += 1;
        nearestAnimal.estrousTimer.set(10);
    }

    craft(itemKey) {
        const equippedItem = this.getEquippedItem();
        if (itemKey === 'wine') {
            if (equippedItem.name !== 'Blood' || equippedItem.quantity < 10) {
                playSound('dud', this.pos);
                return;
            }
            equippedItem.quantity -= 10;
            achievements.award(4);
            this.world.makeItem('wine', this.pos, 2);
            playSound('craft');
        } else if (itemKey === 'meal') {
            if (equippedItem.name !== 'Meat' || equippedItem.quantity < 24) {
                playSound('dud', this.pos);
                return;
            }
            equippedItem.quantity -= 24;
            this.world.makeItem('meal', this.pos, 2);
            playSound('craft', this.pos);
        }
    }

    consume(equippedItem) {
        if (equippedItem.quantity <= 0) return;
        equippedItem.quantity -= 1;
        this.health += 1;
        this.age -= (equippedItem.youth || 0);
        if (equippedItem.name === 'Meal') achievements.award(6);
        playSound('consume', this.pos);
    }

    action(targetPos) {
        if (this.actionTimer.active()) return;
        const equippedItem = this.getEquippedItem();
        this.actionTimer.set(.25);
        if (!equippedItem) return; // this.pickupNearby();
        if (equippedItem.type === 'w') return this.attack();
        if (equippedItem.bait) return this.feedNearest(targetPos);
        if (equippedItem.name === 'Blood') this.craft('wine');
        if (equippedItem.name === 'Meat') this.craft('meal');
        else if (equippedItem.consumable) this.consume(equippedItem);
    }

    plan() {
        if (this.planTimer.active()) return;
        this.planTimer.set(rand(2, 20));
        const worldCenter = this.world.size.scale(.5);
        const base = (this.pos.distance(worldCenter) > 30) ? worldCenter : this.pos; // set 30 based on world size
        this.walkTarget = base.add(vec2(rand(-10, 10), rand(-10, 10)));
        this.urgency = rand(1);
    }

    look() {
        if (this.lookTimer.active()) return;
        const fear = this.lookScary();
        if (this.estrousTimer.active()) this.lookMate();
        else if (!fear) this.lookFood();
    }

    lookScary() {
        if (!this.timid) return 0;
        const scaryEnt = this.world.animals.find((a) => a.scary && !a.isDead() && !a.hasBaitEquipped() && a !== this);
        if (!scaryEnt) return 0;
        const dist = scaryEnt.pos.distance(this.pos);
        if (dist > this.lookRange) return 0; // player is out of sight/smell
        const FEAR_DIST = 6;
        const fear = dist < FEAR_DIST;
        this.lookTimer.set(fear ? .5 : rand(.5, 2));
        this.fearTimer.set(1);
        if (fear) {
            const goto = this.pos.subtract(scaryEnt.pos).normalize(FEAR_DIST + 1);
            this.walkTarget = this.pos.add(goto);
            this.urgency = 1;
        }
        return fear;
    }

    lookFood() {
        if (!this.followsBait) return;
        const pc = this.findPc();
        if (!pc) return;
        const dist = pc.pos.distance(this.pos);
        const LOOK_FOOD_DIST = 4;
        if (dist > this.lookRange || dist > LOOK_FOOD_DIST) return; // player is out of sight/smell
        const item = pc.getEquippedItem();
        if (!item) return; // player is not holding food
        if (pc.hasBaitEquipped() && item.entity) {
            this.walkTarget = item.entity.pos.add( vec2().setAngle(rand(2 * PI), rand(1, 2)) );
        }
    }

    lookMate() {
        if (!this.estrousTimer.active()) return;
        this.lookTimer.set(1);
        const mates = this.world.animals.filter((a) => !a.isDead() && a.estrousTimer.active() && a !== this);
        console.log(mates);
        if (!mates.length) return;
        const nearestMate = this.getNearest(mates, this.pos);
        console.log(nearestMate);
        if (!nearestMate) return;
        // TODO: don't do the mating in the looking?
        if (isOverlapping(nearestMate.pos, nearestMate.size, this.pos, this.size)) this.mate(nearestMate);
        else this.walkTarget = nearestMate.pos;
    }

    mate(mate) {
        this.lookTimer.set(5);
        mate.estrousTimer.unset();
        this.estrousTimer.unset();
        achievements.award(3);
        this.world.makeAnimal(this.pos, [this.species, mate.species])
    }

    getOlder() {
        if (this.agingTimer.active()) return false;
        // @ 6 sec/year --> 10 minutes IRL = 600 sec IRL = 100 years
        // @ 3 sec/year --> 5 minutes IRL = 100 years
        this.agingTimer.set(3);
        this.age += 1;
        if (this.isOld()) this.damage(1, this);
    }

    isOld() { return this.age > this.oldAge; }

    live() { // "update" logic that happens when alive
        if (this.isDead()) return;
        const moveInput = this.moveInput.copy();
        const isMoveInput = (moveInput.x || moveInput.y);
        if (isMoveInput) { // "un-plan"
            this.planTimer.set(60);
            this.walkTarget = null;
            this.urgency = 1;
        }
        this.look();
        this.plan();

        // Movement
        this.movementVelocity = this.velocity.copy();
        if (isMoveInput) {
            const runInput = moveInput.scale(.04 * this.urgency);
            this.movementVelocity = this.movementVelocity.add(runInput);
            // this.movementVelocity = runInput;
            // if (!this.groundTimer.isSet()) playSound('walk', this.pos);
            // this.groundTimer.set(.1);
        } else if (this.walkTarget) {
            const dist = this.pos.distance(this.walkTarget);
            if (dist > 2) {
                this.movementVelocity = this.movementVelocity.lerp(this.walkTarget.subtract(this.pos), 0.5);
            }
        }
        const maxSpd = this.maxSpeed * this.urgency;
        // TODO: use this.movementVelocity.clampLength(); -- but needs tweaking the max speed
        this.movementVelocity.x = clamp(this.movementVelocity.x, -maxSpd, maxSpd);
        this.movementVelocity.y = clamp(this.movementVelocity.y, -maxSpd, maxSpd);
        // // Only use movement velocity if you're currently moving slower
        this.velocity = vec2(
            (this.velocity.x > maxSpd || this.velocity.x < -maxSpd) ? this.velocity.x : this.movementVelocity.x,
            (this.velocity.y > maxSpd || this.velocity.y < -maxSpd) ? this.velocity.y : this.movementVelocity.y,
        );

        const speed = this.velocity.length();
        // TODO: clean this up - redundant?
        this.walkTick += this.movementVelocity.length() * 3.5;
        this.walkCyclePercent += speed * .5;
        this.walkCyclePercent = speed > .01 ? mod(this.walkCyclePercent) : 0;
        // Facing
        this.facing = this.velocity.angle();
        // Aging
        this.getOlder();
    }

    update() {
        this.updateEmotion();
        this.live();
        this.clot();
        // TODO: Always apply friction?
        const friction = vec2(.9999);
        if (this.moveInput.x === 0) friction.x = 0.9;
        if (this.moveInput.y === 0) friction.y = 0.9;
        this.velocity = this.velocity.multiply(friction);
        // call parent and update physics
        super.update();
    }

    render() {
        let bodyPos = this.pos;
        bodyPos = bodyPos.add(vec2(0,.05*Math.sin(this.walkCyclePercent*PI)));
        // const color = this.color.add(this.additiveColor).clamp();
        drawRect(bodyPos.add(vec2(0, -this.size.y * .75)), vec2(this.size.x, .2), new Color(0,0,0, .1), this.angle);
        drawRect(bodyPos.add(vec2(0, -this.size.y * .75)), vec2(this.size.x * .9, .1), new Color(0,0,0, .1), this.angle);
        drawSpecies(mainContext, bodyPos, this.species, this.direction, this.walkTick);
        // drawRect(bodyPos, this.size.scale(this.drawScale), new Color(.3, .3, .3, .4), this.angle);
        
        return;
    }

    renderOld() {
        // drawRect(bodyPos.add(vec2(0, .5)), this.head.scale(this.drawScale), color, this.angle);
        drawRect(bodyPos.add(vec2(0, 0)), this.body, color, this.angle);
        drawRect(bodyPos.add(vec2(0, .3)), this.head, color, this.angle);
        this.legs.forEach((leg, li) => {
            // console.log(this.walkCyclePercent);s
            // TODO: Fix this walking animation
            const liftPercent = Math.sin((this.walkCyclePercent + (.1 * li)) * PI); 
            const lift = vec2(0, .2 * liftPercent);
            leg.forEach((legSegment, i) => {
                if (!i) return; // skip first point
                drawLine(
                    bodyPos.add(leg[i - 1]).add(lift),
                    bodyPos.add(legSegment).add(lift),
                    .1,
                    color, 
                );
            });
        });
        // Eyes
        drawRect(bodyPos.add(vec2(-.1, .3)), vec2(.1), new Color(0, 0, 0));
        drawRect(bodyPos.add(vec2(.1, .3)), vec2(.1), new Color(0, 0, 0));
        drawRect(bodyPos, vec2(.05, .2), new Color(1, 1, 0, .5), this.facing); // Center dot
    }
}

class PlayerCharacterEntity extends CharacterEntity {
    constructor(entOptions) {
        super(entOptions);
        this.isPlayerCharacter = true;
        this.health = 5;
        this.maxSpeed = .2;
        this.renderOrder = 10;
        this.age = 18;
        this.oldAge = 100;
    }

    update() { // from platformer Player extends Character
        // player controls
        // this.holdingJump   = keyIsDown(38) || gamepadIsDown(0);
        // this.holdingShoot  = mouseIsDown(0) || keyIsDown(90) || gamepadIsDown(2);
        // this.pressingThrow = mouseIsDown(1) || keyIsDown(67) || gamepadIsDown(1);
        // this.pressedDodge  = mouseIsDown(2) || keyIsDown(88) || gamepadIsDown(3);
        const numKeyCodes = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
        numKeyCodes.forEach((n) => { if (keyIsDown(n)) this.equip(n - 48); });

        if (keyIsDown(81) || gamepadIsDown(1)) this.throw();
        if (keyIsDown(69) || mouseIsDown(0) || gamepadIsDown(0)) this.action(mousePos);

        // movement control
        this.moveInput = isUsingGamepad ? gamepadStick(0) : 
            vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));

        if (this.moveInput && this.moveInput.x || this.moveInput.y) {
            achievements.award(0);
        }
        this.scary = true;

        super.update();

        const ee = this.equippedEntity;
        if (ee) {
            const thrust = this.actionTimer.active() ? 1 : .7;
            ee.drawSize = vec2(this.actionTimer.active() ? 1.2 : 1);
            ee.localPos = vec2().setAngle(this.facing, thrust);
            let offset = vec2();
            if (this.direction === 0) offset = vec2(.35, -.1);
            else if (this.direction === 1) offset = vec2(.2, -.2);
            else if (this.direction === 7) offset = vec2(-.2, -.1);
            ee.localPos = ee.localPos.add(offset);
            ee.localAngle = this.facing + (PI * 1.2);
            ee.renderOrder = (ee.pos.y < this.pos.y) ? 11 : 9;
        }
        // console.log(this.walkTick, this.velocity.length());
    }
}

class AnimalEntity extends CharacterEntity {
    constructor(entOptions) {
        super(entOptions);
        this.timid = true;
        this.followsBait = true;
    }

    kill() {
        playSound('hit', this.pos);
        this.health = 0;
        // this.angle = .1;
        this.bleed();
        this.setEmotion('dead');
        // Not sure if setTimeout is the best approach in this framework
        setTimeout(() => this.world.makeItem('meat', this.pos, 1), 500);
        setTimeout(() => super.kill(), 4000);
    }

    update() {
        super.update();

        const pc = this.findPc();
        if (!this.isDead() && pc && pc.equippedEntity && pc.equippedEntity.damaging) {
            if (isOverlapping(this.pos, this.size, pc.equippedEntity.pos, pc.equippedEntity.size)) {
                achievements.award(2);
                const dmg = this.damage(pc.equippedEntity.damaging, pc.equippedEntity);
                if (dmg) pc.pickup(this.world.itemTypes.blood);
            }
        }
    }
}

class ItemEntity extends WorldEntity {
    constructor(entOptions) {
        super(entOptions);
        this.itemType = entOptions.itemType;
        this.tileIndex = this.itemType.tileIndex;
        this.fadeTimer = new Timer;
    }

    update() {
        super.update();
        const pc = this.findPc();
        if (this.isDead()) {
            this.drawSize = vec2(1 - this.fadeTimer.getPercent());
            if (pc) this.pos = this.pos.lerp(pc.pos, .1);
        } else if (pc) {
            if (isOverlapping(this.pos, this.size, pc.pos, pc.size)) {
                // achievements.award(2);
                // const dmg = this.damage(pc.equippedEntity.damaging, pc.equippedEntity);
                pc.pickup(this.itemType);
                this.health = 0;
                this.fadeTimer.set(.4);
                setTimeout(() => this.kill(), 400);
            }
        }
    }
}

export { PlayerCharacterEntity, CharacterEntity, AnimalEntity, ItemEntity }