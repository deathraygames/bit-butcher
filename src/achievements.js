import { playSound } from './sounds.js';
let achievements = [
    ['Move (W,A,S,D or Arrows)'], // 0
    ['Pick up and equip knife'], // 1
    ['Stab an animal'], // 2
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
export { achievements };
