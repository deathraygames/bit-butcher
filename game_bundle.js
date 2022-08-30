(function () {
    'use strict';

    let sounds;
    const setSounds = () => {
        if (!Sound) throw new Error('no Sound');
        if (sounds) return; // already set
        sounds = {
            // for some reason, the property names were getting uglified so they need quotes
            'hit': new Sound([,,183,.03,.02,.09,,1.49,-1.8,,,,-0.01,1.8,-1,.1,,.36,.08,.25]),
            'attack': new Sound([,,493,.01,.09,0,4,1.14,,,,,,,,.1,,.1,.01]),
            'craft': new Sound([,,7,.03,.28,.44,2,1.44,,-0.3,20,.11,.04,,,.1,,.55,.29]),
            'dud': new Sound([.8,,112,,.07,.05,1,2.26,-0.6,,,,,1.8,,.1,.2,.98,.1,.1]),
            'powerup': new Sound([,,1152,,.04,.17,,1.21,,,744,.08,,,,,,.91,.03]),
            'pickup': new Sound([1.05,,172,.02,,.17,2,.02,,,-409,.06,,,,.1,,.55,,.19]),
            'walk': new Sound([.2,.1,70,,,.01,4,,,,-9,.1,,,,,,.5]),
            'consume': new Sound([1.2,,16,.07,.18,.34,1,.38,-0.1,-5.6,49,.15,.02,-0.1,36,.1,,.39,.14]),
        };
    };

    const playSound = (name, pos) => {
        setSounds();
        if (!sounds) throw new Error('no sounds');
        if (!sounds[name]) { console.warn('No sound', name, 'in', sounds); return; }
        sounds[name].play(pos);
    };

    let achievements = [
        ['Move (W,A,S,D or Arrows)'], // 0
        ['Pick up and equip knife'], // 1
        ['Stab animal'], // 2
        ['Breed animals'], // 3
        ['Make forbidden wine'], // 4
        ['Collect 24 meat'], // 5
        ['Eat a meaty meal'], // 6
    ];
    let a = achievements;
    a.award = (n) => {
        if (!a[n][1]) playSound('powerup');
        a[n][1] = (a[n][1] || 0) + 1;
    };
    a.count = () => a.reduce((c, x) => c + (x[1] ? 1 : 0), 0);

    const size = 24;
    const ri$1 = randInt;
    const MUTANT_CHANCE = 20; // 1 out of 20

    function fixPoint(n) {
    	return Math.max(Math.min(Math.round(n), size), 0);
    }

    function addMid(obj) {
    	obj.midX = fixPoint(obj.x + (obj.sizeX / 2));
    	obj.midY = fixPoint(obj.y + (obj.sizeY / 2));
    	obj.endX = fixPoint(obj.x + obj.sizeX);
    	obj.endY = fixPoint(obj.y + obj.sizeY);
    }

    function getSpecies(color) {
    	let r = color ? color.r * 255 : ri$1(180) + 20;
    	let g = color ? color.g * 255 : ri$1(180) + 20;
    	let b = color ? color.b * 255 : ri$1(180) + 20;
    	// if (r + g + b <= 4) r += 2;
    	const bodyW = ri$1(6, size * .6);
    	const bodyL = ri$1(6, size * .6);
    	const bodyH = ri$1(5, size * .6);
    	const bodyLevel = ri$1(0, size - bodyH - 2); // leave space for feet
    	const headH = ri$1(6, size * .5); // size / 3 + rand(size / 5);
    	const headW = ri$1(8, size * .6);
    	const headLevel = ri$1(0, size - headH - size * .2);
    	const eyeW = ri$1(1, 3);
    	const eyeH = ri$1(1, 3);
    	const eyeLevel = ri$1(2, headH - 4);
    	const eyeGap = ri$1(1, headW * .5);
    	const mouthW = ri$1(3, headW - 4);
    	const mouthH = ri$1(1, 2);
    	const mouthLevel = ri$1(2, headH - eyeLevel - mouthH);
    	const frontKneeBend = ri$1(-4, -1);
    	const backKneeBend = ri$1(-4, 3);
    	const kneeWidth = 2;
    	const legWidth = Math.min(bodyW / 2, ri$1(1, 6));
    	return {
    		baseColor: [r-20,g-20,b-10],
    		backColor: [r-40,g-40,b-20],
    		forwardColor: [r,g,b],
    		eyeColor: (ri$1(2) === 0) ? [0,0,0] : [200,200,200],
    		headW, headH, headLevel,
    		bodyW, bodyL, bodyH, bodyLevel,
    		eyeW, eyeH, eyeLevel, eyeGap,
    		mouthW, mouthH, mouthLevel,
    		frontKneeBend, backKneeBend, kneeWidth, legWidth
    	};
    }

    function breedRandomValue(bioParents, key) {
    	// First parent in array is considered the dominant parent
    	const dominantParentValue = bioParents[0][key];
    	// If it's a number value, then determine randomly
    	if (typeof dominantParentValue === 'number') {
    		const range = bioParents.reduce((rangeArr, species) => {
    			const value = species[key];
    			if (value < rangeArr[0]) rangeArr[0] = value;
    			if (value > rangeArr[1]) rangeArr[1] = value;
    			return rangeArr;
    		}, [Infinity, -Infinity]); // index 0 is min, index 1 is max
    		return ri$1(range[0], range[1]);
    	}
    	// Otherwise just use the dom parent's value e.g. for colors
    	return dominantParentValue;
    }

    function breedSpecies(bioParents) {
    	if (!bioParents) return;
    	const newDna = getSpecies();
    	Object.keys(newDna).forEach((key) => {
    		if (ri$1(MUTANT_CHANCE) > 0) newDna[key] = breedRandomValue(bioParents, key);
    	});
    	return newDna;
    }

    function getLegPoints(x, y, kneeY, legWidth, kneeBend, kneeWidth, lift) {
    	const len = size - y;
    	const liftAmount = Math.floor((len / 2) * lift);
    	const footY = size - liftAmount;
    	const liftKneeY = kneeY - (liftAmount / 2);
    	// TODO: This is not symmmetric, doesn't look correct when leg is pointing right
    	const kneeX = Math.max(0, x + kneeBend + (kneeBend * lift));
    		return [
    		x, y, // hip - top left
    		x + legWidth, y, // hip - top right
    		kneeX + kneeWidth, liftKneeY, // right side of knee (back if left)
    		x + legWidth, footY, // foot (heel if left)
    		x, footY, // foot - toe
    		kneeX, liftKneeY, // knee
    	];
    }

    function drawSpecies(ctx, pos, species, direction = 4, t = 0) {
    	// const { x, y } = pos;
    	worldToScreen(pos);
    	const {
    		baseColor, backColor, forwardColor, eyeColor,
    		bodyW, bodyL, bodyH, bodyLevel,
    		headW, headH, headLevel,
    		eyeW, eyeH, eyeLevel, eyeGap,
    		mouthW, mouthH, mouthLevel,
    		frontKneeBend, backKneeBend, kneeWidth, legWidth,
    	} = species;
    	const showEyes = (direction >= 2 && direction <= 6);
    	const kneeDirectionMultipliers = [0, -.5, -1, -.5, 0, .5, 1, .5];
    	const kneeDirectionMultiplier = kneeDirectionMultipliers[direction];
    	const xMultipliers = [.5, .75, 1, .75, .5, .25, 0, .25];
    	const xMultiplier = xMultipliers[direction];
    	const head = {
    		x: (size - headW) * xMultiplier,
    		y: headLevel,
    		sizeX: headW, sizeY: headH,
    	};
    	const bodyActualW = (bodyW + bodyL) / 2;
    	const bodyXMult = ((1 - xMultiplier) + 1) / 3; // once we get body actualW working we can decrease this effect and make it .5
    	const body = {
    		x: (size - bodyActualW) * bodyXMult,
    		y: bodyLevel,
    		sizeX: bodyActualW, sizeY: bodyH,
    	};
    	addMid(head);
    	addMid(body);
    	const legLength = (size - body.endY) / 2;
    	const kneeY = fixPoint(body.endY + legLength);
    	const lift = (Math.sin(t) + 1) / 2;
    	const kneeBend = frontKneeBend * kneeDirectionMultiplier;
    	const frontLegPoints = getLegPoints(body.x, body.endY, kneeY, legWidth, kneeBend, kneeWidth, 1 - lift);
    	const backLegPoints = getLegPoints(body.endX - legWidth, body.endY, kneeY, legWidth, kneeBend, kneeWidth, lift);
    	const neckPoints = [
    		head.midX - (headW / 4), head.midY,
    		head.midX + (headW / 4), head.midY,
    		body.midX + (bodyActualW / 4), body.midY - 1,
    		body.midX - (bodyActualW / 4), body.midY - 1,
    	];
    	const headCenterX = head.x + (headW * xMultiplier);
    	const eyeOffset = Math.max(1, eyeGap / 2);
    	const eye1 = {
    		x: headCenterX - eyeOffset - eyeW,
    		y: head.y + eyeLevel,
    		sizeX: eyeW, sizeY: eyeH,
    	};
    	const eye2 = {
    		x: headCenterX + eyeOffset,
    		y: eye1.y,
    		sizeX: eyeW, sizeY: eyeH,
    	};
    	const mouthX = Math.max(headCenterX - (mouthW / 2), head.x);
    	const mouthEndX = Math.min(mouthX + mouthW, head.endX);
    	const mouth = {
    		x: mouthX,
    		y: head.y + eyeLevel + mouthLevel,
    		sizeX: mouthEndX - mouthX,
    		sizeY: mouthH,
    	};

    	// TODO: Fix this?
    	const offsetX = -.5; // -12;
    	const offsetY = -.5; // -12;
    	const offsetScale = 0.055;
      	const drawMyPolygon = (p, c) => {
    		drawCanvas2D(pos, vec2(offsetScale), 0, 0, (ctx) => drawPolygon(ctx, offsetX, offsetY, p, c));
    	};
    	const drawMyPart = (p, c) => {
    		drawCanvas2D(pos, vec2(offsetScale), 0, 0, (ctx) => drawPart(ctx, offsetX, offsetY, p, c));
    	};
    	if (!showEyes) {
    		drawMyPart(head, backColor);
    		drawMyPolygon(neckPoints, baseColor);
    		drawMyPolygon(frontLegPoints, baseColor);
    		drawMyPolygon(backLegPoints, baseColor);
    		drawMyPart(body, baseColor);
    	} else {
    		drawMyPart(body, baseColor);
    		drawMyPolygon(neckPoints, baseColor);
    		drawMyPolygon(frontLegPoints, baseColor);
    		drawMyPolygon(backLegPoints, baseColor);
    		drawMyPart(head, forwardColor);
    		if (eye1.x >= head.x) {
    			drawMyPart(eye1, eyeColor);
    		}
    		if (eye2.x <= head.x + headW) {
    			drawMyPart(eye2, eyeColor);
    		}
    		drawMyPart(mouth, [0,0,0]);
    	}
    }

    function getColorStyle(color) {
    	if (!color) return '#fff';
      const c = (i) => Math.max(0, Math.min(255, color[i]));
      return `rgb(${c(0)},${c(1)},${c(2)}`;
    }

    function drawPolygon(ctx, x, y, points, color) {
    	ctx.fillStyle = getColorStyle(color);
    	ctx.beginPath();
    	points.forEach((n, i) => {
    		if (i % 2 === 1) return; // skip odd indices
    		const fn = i === 0 ? 'moveTo' : 'lineTo';
    		ctx[fn](
    			Math.round(x * size + n),
    			Math.round(y * size + points[i + 1])
    		);
    	});
    	ctx.closePath();
    	ctx.fill();
    }

    function drawPart(ctx, x, y, part, color) {
    	ctx.fillStyle = getColorStyle(color);
    	ctx.fillRect(
    		Math.round(x * size + part.x),
    		Math.round(y * size + part.y),
    		Math.round(part.sizeX),
    		Math.round(part.sizeY),
    	);
    }

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
            const direction = randInt(4);
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
            things.reduce((best, a) => {
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
            if (pc.hasBaitEquipped()) {
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
            this.world.makeAnimal(this.pos, [this.species, mate.species]);
        }

        getOlder() {
            if (this.agingTimer.active()) return false;
            // @ 6 sec/year --> 10 minutes IRL = 600 sec IRL = 100 years
            // @ 3 sec/year --> 5 minutes IRL = 100 years
            this.agingTimer.set(2);
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
            const { world } = this;
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
            for(i = 100; i--;) { species.push(makeSpecies()); }
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
                    const direction = randInt(4);
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

    const TILE_SIZE$1 = window.TILE_SIZE || 24;
    let ctx;
    let tileCount = 0;
    let ri = randInt;

    function getTileX() {
        return TILE_SIZE$1 * (++tileCount);
    }

    const rect = (r, g, b, x, y, q = TILE_SIZE$1, w = TILE_SIZE$1) => {
        ctx.fillStyle = `#${r}${g}${b}`;
        ctx.fillRect(x, y, q, w);
    };

    function drawTerrain(r, g, b) {
        const x = getTileX(),
            y = 0;
        rect(r, g, b, x, y);
        [6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1].forEach((n) => {
            rect(
                ri(r, 6),
                ri(g, 6),
                ri(b, 6),
                x + ri(TILE_SIZE$1 - n),
                y + ri(TILE_SIZE$1 - n),
                n,
                n,
            );
        });
    }

    function drawTiles(doc) {
        const canvas = doc.createElement('canvas');
        canvas.width = 16 * TILE_SIZE$1;
        canvas.height = 2 * TILE_SIZE$1;
        doc.body.appendChild(canvas);
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
        ctx.font = '20px serif';
        [ // Tile indices:
            '🔪', // 5
            '🩸', // 6s
            '🍖', // 7
            '🌿', // 8 
            '💕', // 9
            '❕', // 10
            '💢', // 11
            '💀', // 12
            '🍷', // 13
            '🍲', // 14
        ].forEach((emoji) => {
            ctx.fillText(emoji, getTileX() - 1, 20);
        });
        // const x = getTileX();
        // rect(3, 3, 3, x, 0);
        // Tile incides 5, 6, 7, 8, 9
        // ctx.fillText('🔪🩸🍖🌿💕', x - 1, 19.5);
        // Test
        // ctx.fillText('🦀🍖🥩🍗💀🔪', 0, 44);
        // ctx.fillText('🔥', 0, 22);
        return canvas.toDataURL();
    }

    function loadTileImageSource(src) {
        return new Promise((resolve) => {
            const t = new Image(); // The tile image
            t.onload = () => resolve(drawTiles(document));
            if (src) t.src = src;
            else t.onload();
        });
    }

    // popup errors if there are any (help diagnose issues on mobile devices)
    //onerror = (...parameters)=> alert(parameters);

    // game variables
    let particleEmiter;
    const win = window;
    let gameState = 0; // 0 = not begun, 1 = alive & running, 2 = dead, 3 = win
    const TILE_SIZE = win.TILE_SIZE = 24; // was 16 in demo
    const WIN_MEAT = 24;
    let wv;
    let font;

    // medals
    // const medal_example = new Medal(0, 'Example Medal', 'Medal description goes here.');
    // medalsInit('Hello World');

    ///////////////////////////////////////////////////////////////////////////////
    function gameInit()
    {
        wv = win.wv = new WorldView();
        wv.init();
        font = new FontImage;

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
        const { pc } = wv;
        if (pc !== win.pc) win.pc = pc; // Just for easy debugging
        if (mouseWasPressed(0))
        ;

        if (keyWasReleased(13)) {
            if (gameState === 2 || gameState === 3) {
                win.location.reload();
            } else if (gameState === 0 || gameState === 2) {
                gameState = 1;
                wv.makePc();
            }
        }
        if (pc) {
            win.achievements = achievements;
            cameraPos =  cameraPos.lerp(pc.pos, 0.1);
            if (pc.isDead()) gameState = 2;
            else {
                const meat = pc.findInventoryItem('Meat');
                const meatQuantity = meat ? meat.quantity : 0;
                if (meatQuantity >= WIN_MEAT) achievements.award(5);
                if (achievements.count() === achievements.length) gameState = 3;
            }
        }

        // move particles to mouse location if on screen
        // if (mousePosScreen.x) {
            // particleEmiter.pos = mousePos;
            // pc.pos = mousePos;
            // particleEmiter.pos = pc.pos;
        // }as

        cameraScale = clamp(cameraScale*(1-mouseWheel/10), 1, 1e3);
        
        // if (wv) wv.update();
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
    function renderInventory(pc) {
        const midX = overlayCanvas.width/2;
        // const invText = pc.inventory
        //     .map((item) => item ? (item.name || ' ') + ' x' + item.quantity : ' ')
        //     .map((n, i) => i + ': ' + (pc.equipIndex === i ? `[ ${n.toUpperCase()} equipped ]` : `[ ${n} ]`))
        //     .concat(['0: [Hands]', 'E: Action'])
        //     .join('    ');
        // drawTextScreen(invText, vec2(midX, overlayCanvas.height - 40), 20, new Color, 4);

        const equipItem = pc.inventory[pc.equipIndex];
        const invTipText = `${equipItem ? equipItem.name : 'Nothing'} equipped, 1-9: Equip item, E: Action`;
        // drawTextScreen(invTipText, vec2(midX, overlayCanvas.height - 40), 20, new Color, 4);
        font.drawText(invTipText, screenToWorld(vec2(midX, overlayCanvas.height - 40)), 2/cameraScale, 1);

        for(let i = 1; i <= 10; i++) {
            const size = vec2(50, 70);
            const pos = vec2(
                midX - (5 * 60) + (i * 60),
                overlayCanvas.height - 100,
            );
            const itemIndex = i % 10;
            const color = (itemIndex === pc.equipIndex) ? new Color(.9,.9,.9,.3) : new Color(.1,.1,.1,.3);
            drawRectScreenSpace(pos, size, color);
            const item = pc.inventory[itemIndex];
            if (item) {
                // TODO: Switch to drawing pixelated tile
                drawTextScreen(item.emoji, pos.add(vec2(0, -6)), 28);
                font.drawText(''+item.quantity, screenToWorld(pos.add(vec2(5, 14))), 2/cameraScale, 1);
            }
        }
    }

    function gameRenderPost()
    {
        const { pc } = wv;
        const d = drawTextScreen;
        const white = new Color;
        // draw to overlay canvas for hud rendering
        // d('Hello World 🦀', vec2(overlayCanvas.width/2, 80), 80, new Color, 9);
        const midX = overlayCanvas.width/2;
        const midY = overlayCanvas.height/2;
        // const r = (n) => Math.round(pc.pos[n] * 10) / 10;
        // d(`x ${r('x')}, y ${r('y')}`, vec2(midX, 80), 20, new Color, 9);
        

        
        if (gameState === 2) {
            d('YOU DIED', vec2(midX, midY - 90), 90, new Color(1, 0, 0), 4);
            d('Press Enter to restart', vec2(midX, midY), 40, new Color(1, .5, .5), 4);
        } else if (gameState === 0) {
            font.drawText('BIT BUTCHER', cameraPos.add(vec2(0,3)), .2, 1);
            // d('BIT BUTCHER', vec2(midX, midY - 90), 90, white, 4);
            // d('Press Enter to start', vec2(midX, midY), 40, white, 4);
            font.drawText('Press Enter to start', cameraPos.add(vec2(0, .5)), .1, 1);
        } else if (gameState === 1 || gameState === 3 && pc) {
            renderInventory(pc);

            achievements.forEach((a, i) => 
                d(
                    `[${a[1] ? 'X' : ' '}] ` + a[0],
                    vec2(overlayCanvas.width - 260, 100 + (i * 30)),
                    18,
                    a[1] ? new Color(.4,1,.4,.5) : white,
                    4,
                    new Color(0,0,0, a[1] ? .5 : 1),
                    'left'
                )
            );

            const gb = (pc.age > 85) ? 0 : 1;
            const c = new Color(1,gb,gb,.8);
            const w = 500 * (Math.max(0, 100 - pc.age)/100);
            drawRectScreenSpace(vec2(midX, 40), vec2(w, 2), c);
            d(`Age: ${Math.ceil(pc.age)}`, vec2(midX, 40), 20, c, 4);
            if (gameState === 3) {
                font.drawText('YOU WIN', cameraPos.add(vec2(0,5)), .2, 1);
                d('Press Enter to play again', vec2(midX, midY - 80), 40, white, 4);
            }
        }
    }



    ///////////////////////////////////////////////////////////////////////////////
    // Startup LittleJS Engine
    (async () => {
        tileSizeDefault = vec2(TILE_SIZE);
        const tis = await loadTileImageSource();
        engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, tis);
    })();

})();
