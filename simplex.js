const chalk = require('chalk');

const simplex = tableau => {
  if (tableau[tableau.length - 1].every(el => el <= 0)) {
    console.log(chalk.green(tableau[tableau.length - 1]));
    return tableau;
  }

  const tablo = [...tableau];
  console.log(tablo[tablo.length - 1]);
  const objFunction = tablo[tablo.length - 1];
  // console.log('OBJ', objFunction);
  const pivoColIndex = objFunction.indexOf(Math.max(...objFunction));
  const pivoColArray = tablo.map(row => row[pivoColIndex]);
  const rightHandSide = tablo.map(row => row[row.length - 1]);
  // console.log('COL ARR:', pivoColArray);
  const pivoColArrayTmp = pivoColArray;
  pivoColArrayTmp.pop();
  const bottleneck = pivoColArrayTmp.map((element, index) => {
    if (element <= 0) {
      return Infinity;
    } else {
      return rightHandSide[index] / element;
    }
  });

  const pivoRowIndex = bottleneck.indexOf(Math.min(...bottleneck));
  const pivoRowArray = tablo[pivoRowIndex];
  const pivoElement = tablo[pivoRowIndex][pivoColIndex];

  const pivoRowArrayUnit = pivoRowArray.map(el => el / pivoElement);

  const nextTablo = tablo.map((row, index) => {
    if (index === pivoRowIndex) {
      return pivoRowArrayUnit;
    }
    return sub(row, multiplie(pivoRowArrayUnit, row[pivoColIndex]));
  });

  // return nextTablo
  return simplex(nextTablo);
};

const multiplie = (array, multi) => {
  return array.map(el => el * multi);
};

const sub = (array1, array2) => {
  return array1.map((el, index) => el - array2[index]);
};

module.exports = simplex;
