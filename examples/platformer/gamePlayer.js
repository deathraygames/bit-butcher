/*
    LittleJS Platformer Example - Player
    - Platform style player controls
    - Player can jump, shoot, roll, and throw grenades
    - Can be controlled with keyboard and mouse or gamepad
    - Attaches weapon which can be fired
    - Plays animation and sound effects
*/

'use strict';

class Character extends GameObject 
{
    constructor(pos)
    { 
        super(pos, vec2(.6,.95), 32);

        new Weapon(this.lastPos = this.pos, this);
        this.groundTimer        = new Timer;
        this.jumpTimer          = new Timer;
        this.pressedJumpTimer   = new Timer;
        this.dodgeTimer         = new Timer;
        this.dodgeRechargeTimer = new Timer;
        this.deadTimer          = new Timer;
        this.grendeThrowTimer   = new Timer;
        this.drawSize = vec2(1);
        this.color = (new Color).setHSLA(rand(),1,.7);
        this.renderOrder = 10;
        this.walkCyclePercent = 0;
        this.health = 1;
        this.moveInput = 0;
        this.setCollision(1);
    }
    
    update() 
    {
        this.gravityScale = 1; // reset to default gravity

        if (this.isDead())
            return super.update();

        const moveInput = this.moveInput.copy();
        
        // jump
        if (!this.holdingJump)
            this.pressedJumpTimer.unset();
        else if (!this.wasHoldingJump || this.climbingWall)
            this.pressedJumpTimer.set(.3);
        this.wasHoldingJump = this.holdingJump;

        // wall climb
        this.climbingWall = 0;
        if (moveInput.x && !this.velocity.x && this.velocity.y < 0)
        {
            this.velocity.y *=.8;
            this.climbingWall = 1;
        }

        if (this.dodgeTimer.active())
        {
            // update roll
            this.angle = this.getMirrorSign()*2*PI*this.dodgeTimer.getPercent();
            if (this.groundObject)
                this.velocity.x += this.getMirrorSign()*.1;
        }
        else
        {
            // not rolling
            this.angle = 0;
            if (this.pressedDodge && !this.dodgeRechargeTimer.active())
            {
                // start dodge
                this.dodgeTimer.set(.4);
                this.dodgeRechargeTimer.set(2);
                this.jumpTimer.unset();
                sound_dodge.play(this.pos);

                if (!this.groundObject && this.getAliveTime() > .2)
                    this.velocity.y += .2;
            }
            if (this.pressingThrow && !this.wasPressingThrow && !this.grendeThrowTimer.active())
            {
                // throw greande
                const grenade = new Grenade(this.pos);
                grenade.velocity = this.velocity.add(vec2(this.getMirrorSign(),rand(.8,.7)).normalize(.2+rand(.02)));
                grenade.angleVelocity = this.getMirrorSign() * rand(.8,.5);
                sound_jump.play(this.pos);
                this.grendeThrowTimer.set(1);
            }
            this.wasPressingThrow = this.pressingThrow;
        }

        // allow grabbing ladder at head or feet
        let touchingLadder = 0;
        for (let y=2;y--;)
        {
            const testPos = this.pos.add(vec2(0, y + .1*moveInput.y - this.size.y/2));
            const collisionData = getTileCollisionData(testPos);
            touchingLadder |= collisionData == tileType_ladder;
        }
        if (!touchingLadder)
            this.climbingLadder = 0;
        else if (moveInput.y)
            this.climbingLadder = 1;

        // update weapon trigger
        this.weapon.triggerIsDown = this.holdingShoot && !this.dodgeTimer.active();

        // update ladder
        if (this.climbingLadder)
        {
            this.gravityScale = this.climbingWall = this.groundObject = 0;
            this.jumpTimer.unset();
            this.groundTimer.unset();
            this.velocity = this.velocity.multiply(vec2(.85)).add(vec2(0,.02*moveInput.y));

            // pull towards ladder
            const delta = (this.pos.x|0)+.5 - this.pos.x;
            this.velocity.x += .02*delta*abs(moveInput.x ? 0:moveInput.y);
            moveInput.x *= .2;

            // exit ladder if ground is below
            this.climbingLadder = moveInput.y >= 0 || getTileCollisionData(this.pos.subtract(vec2(0,1))) <= 0;
        }
        else
        {
            // update jumping and ground check
            if (this.groundObject || this.climbingWall)
            {
                if (!this.groundTimer.isSet())
                    sound_walk.play(this.pos); // land sound
                    
                this.groundTimer.set(.1);
            }

            if (this.groundTimer.active() && !this.dodgeTimer.active())
            {
                // is on ground
                if (this.pressedJumpTimer.active() && !this.jumpTimer.active())
                {
                    // start jump
                    if (this.climbingWall)
                        this.velocity.y = .25;
                    else
                    {
                        this.velocity.y = .15;
                        this.jumpTimer.set(.2);
                    }
                    sound_jump.play(this.pos);
                }
            }

            if (this.jumpTimer.active() && !this.climbingWall)
            {
                // update variable height jump
                this.groundTimer.unset();
                if (this.holdingJump && this.velocity.y > 0 && this.jumpTimer.active())
                    this.velocity.y += .017;
            }

            if (!this.groundObject)
            {
                // air control
                if (sign(moveInput.x) == sign(this.velocity.x))
                    moveInput.x *= .1; // moving with velocity
                else
                    moveInput.x *= .2; // moving against velocity (stopping)
                
                // slight extra gravity when moving down
                if (this.velocity.y < 0)
                    this.velocity.y += gravity*.2;
            }
        }
        
        // apply movement acceleration and clamp
        const maxCharacterSpeed = .2;
        this.velocity.x = clamp(this.velocity.x + moveInput.x * .042, -maxCharacterSpeed, maxCharacterSpeed);

        // track last pos for ladder collision code
        this.lastPos = this.pos.copy();

        // call parent and update physics
        super.update();

        // update walk cycle
        const speed = this.velocity.length();
        if (this.climbingLadder || this.groundTimer.active() && !this.dodgeTimer.active())
        {
            this.walkCyclePercent += speed * .5;
            this.walkCyclePercent = speed > .01 ? mod(this.walkCyclePercent) : 0;
        }
        else
            this.walkCyclePercent = 0;

        // update walk sound
        this.walkSoundTime += speed;
        if (speed > .001 && ((this.climbingLadder || this.groundTimer.active()) && !this.dodgeTimer.active()))
        {
            if (this.walkSoundTime > 1)
            {
                this.walkSoundTime = this.walkSoundTime%1;
                sound_walk.play(this.pos);
            }
        }
        else
            this.walkSoundTime = 0;

        // update mirror
        if (moveInput.x && !this.dodgeTimer.active())
            this.mirror = moveInput.x < 0;
        
        // set tile to use
        this.tileIndex = this.isDead() ? 3 : 
            this.climbingLadder || this.groundTimer.active() ? 3 + 2*this.walkCyclePercent|0 : 4;
    }
       
    render()
    {
        let bodyPos = this.pos;
        if (!this.isDead())
        {
            // bounce pos with walk cycle
            bodyPos = bodyPos.add(vec2(0,.05*Math.sin(this.walkCyclePercent*PI)));

            // make bottom flush
            bodyPos = bodyPos.add(vec2(0,(this.drawSize.y-this.size.y)/2));
        }
        drawTile(bodyPos, this.drawSize, this.tileIndex, this.tileSize, this.color, this.angle, this.mirror);
    }

    damage(damage, damagingObject)
    {
        if (this.isDead() || this.getAliveTime() < 1 || this.dodgeTimer.active() || godMode)
            return;

        makeBlood(damagingObject ? damagingObject.pos : this.pos);
        super.damage(damage, damagingObject);
    }

    kill(damagingObject)                  
    {
        if (this.isDead())
            return;

        makeBlood(this.pos, 300);
        sound_die.play(this.pos);

        this.health = 0;
        this.weapon.destroy();
        this.deadTimer.set();
        this.size = this.size.scale(.5);
        const fallDirection = damagingObject ? sign(damagingObject.velocity.x) : randSign();
        this.angleVelocity = fallDirection*rand(.22,.14);
        this.angleDamping = .9;
        this.renderOrder = -1;  // move to back layer
    }
    
    collideWithTile(data, pos)
    {
        if (!data)
            return;

        if (data == tileType_ladder)
        {
            // handle ladder collisions
            if (pos.y + 1 > this.lastPos.y - this.size.y/2)
                return;

            if (getTileCollisionData(pos.add(vec2(0,1)))      // above
                && !getTileCollisionData(pos.add(vec2(1,0)))  // left
                && !getTileCollisionData(pos.add(vec2(1,0)))) // right
                return; // dont collide if something above it and nothing to left or right

            // allow standing on top of ladders
            return !this.climbingLadder;
        }

        const d = pos.y - this.pos.y;
        if (!this.climbingLadder && this.velocity.y > .1 && d > 0 && d < this.size.y/2)
        if (destroyTile(pos))
        {
            // break blocks above
            this.velocity.y = 0;
            return;
        }

        return 1;
    }
}

///////////////////////////////////////////////////////////////////////////////

class Player extends Character
{
    update() 
    {
        // player controls
        this.holdingJump   = keyIsDown(38) || gamepadIsDown(0);
        this.holdingShoot  = mouseIsDown(0) || keyIsDown(90) || gamepadIsDown(2);
        this.pressingThrow = mouseIsDown(1) || keyIsDown(67) || gamepadIsDown(1);
        this.pressedDodge  = mouseIsDown(2) || keyIsDown(88) || gamepadIsDown(3);

        // movement control
        this.moveInput = isUsingGamepad ? gamepadStick(0) : 
            vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40));

        super.update();
    }

    kill()
    {
        ++deaths;
        super.kill();
    }
}