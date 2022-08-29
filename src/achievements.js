let achievements = [
    ['Move (W,A,S,D or Arrows)'],
    ['Equip knife (Press 1)'],
    ['Stab animal'],
    ['Collect 24 meat'],
];
let a = achievements;
a.award = (n) => a[n][1] = (a[n][1] || 0) + 1;
export { achievements };
