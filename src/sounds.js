let sounds;
const setSounds = () => {
    if (!Sound) throw new Error('no Sound');
    if (sounds) return; // already set
    sounds = {
        // for some reason, the "hit" property was getting uglified
        'hit': new Sound([,,183,.03,.02,.09,,1.49,-1.8,,,,-0.01,1.8,-1,.1,,.36,.08,.25]),
        'click': new Sound([.5,.5]),
        'attack': new Sound([,,493,.01,.09,0,4,1.14,,,,,,,,.1,,.1,.01]),
    };
};

const playSound = (name, pos) => {
    setSounds();
    if (!sounds) throw new Error('no sounds');
    if (!sounds[name]) { console.warn('No sound', name, 'in', sounds); return; }
    sounds[name].play(pos);
};

export { setSounds, playSound };
