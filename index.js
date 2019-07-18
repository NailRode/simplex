const parse = require('./parse');
const path = require('path');
const fs = require('fs');
const cTable = require('console.table');
const chalk = require('chalk');

const fileNames = [];
const paths = [];
let tableAus = [];

function simplex() {
  parseBenchmarks('benchmarks')
    .then(benchmarks => transpose(benchmarks))
    .then(transposedBenchmarks => createTableau(transposedBenchmarks))
    .then(tablaus => {
      tableAus = tablaus;
      pivot(tablaus);
    });
}

async function parseBenchmarks(folder) {
  getFileNames(folder);
  fileNames.forEach(name => {
    const bmPath = getPath(folder, name);
    paths.push(bmPath);
  });

  let promises = paths.map(path => parse(path));
  let newBenchmarks = await Promise.all(promises);

  return newBenchmarks;
}

function getFileNames(dirName) {
  fs.readdirSync(dirName).forEach(fileName => {
    fileNames.push(fileName);
  });
}

function getPath(folder, fileName) {
  const bmPath = path.join(__dirname, folder, fileName);
  return bmPath;
}

function transpose(benchmarks) {
  return new Promise(resolve => {
    fileNames.forEach((fileName, i) => {
      let bmName = fileName.substring(
        fileName.indexOf('KI'),
        fileName.indexOf('.')
      );
      benchmarks[i][bmName].matrix = benchmarks[i][bmName].matrix[0].map(
        (col, index) => benchmarks[i][bmName].matrix.map(row => row[index])
      );
    });
    resolve(benchmarks);
  });
}

function createTableau(transposedBenchmarks) {
  return new Promise(resolve => {
    transposedBenchmarks.forEach(benchmark => {
      addSlackVars(benchmark);
    });
    let tablaus = transposedBenchmarks;
    resolve(tablaus);
  });
}

function addSlackVars(benchmark) {
  return new Promise(resolve => {
    let matrizen = Object.values(benchmark);
    matrizen.forEach(obj => {
      obj.matrix.forEach((row, i) => {
        const firstZeroArray = new Array(i).fill(0);
        const secondZeroArray = new Array(
          row.length - i + (obj.matrix.length - row.length)
        ).fill(0);
        const firstRowPart = row;
        const secondRowPart = [...firstZeroArray, 1, ...secondZeroArray];
        obj.matrix[i] = [...firstRowPart, ...secondRowPart, 0];
      });
    });
    resolve(benchmark);
  });
}

function pivot(tableaus) {
  tableaus.forEach(tableau => {
    let matrizen = Object.values(tableau);
    matrizen.forEach(obj => {
      let nonNegative = isAllNonNegative(obj.matrix[obj.matrix.length - 1]);
      if (nonNegative) {
        console.log(obj.matrix);
        pivotOperations(tableau);
      } else {
        console.log(chalk.red('DONE'));
      }
    });
  });
}

function pivotOperations(tableau) {
  getPivotColumnIndex(tableau)
    .then(obj => divideByPivotColumn(obj.tableau, obj.columnIndex))
    .then(obj => getPivotRowIndex(obj.tableau, obj.columnIndex))
    .then(obj => eliminateByPivot(obj.tableau, obj.columnIndex, obj.rowIndex))
    .then(obj =>
      checkForNegativeValues(obj.tableau, obj.columnIndex, obj.rowIndex)
    );
}

function getPivotColumnIndex(tableau) {
  return new Promise(resolve => {
    let matrizen = Object.values(tableau);
    matrizen.forEach(obj => {
      let objectiveFunction = obj.matrix[obj.matrix.length - 1];
      let maxVal = Math.max(...objectiveFunction);
      resolve({
        tableau: tableau,
        columnIndex: objectiveFunction.indexOf(maxVal)
      });
    });
  });
}

function getPivotRowIndex(tableau, columnIndex) {
  return new Promise(resolve => {
    let lastColumn = [];
    let minVal;
    let matrizen = Object.values(tableau);
    matrizen.forEach(obj => {
      obj.matrix.forEach((row, i) => {
        lastColumn.push(row[row.length - 2 - i]);
        minVal = Math.min(...lastColumn);
      });
    });
    resolve({
      tableau: tableau,
      columnIndex: columnIndex,
      rowIndex: lastColumn.indexOf(minVal)
    });
  });
}

function eliminateByPivot(tableau, columnIndex, rowIndex) {
  return new Promise(resolve => {
    let matrizen = Object.values(tableau);
    let pivotElement;
    matrizen.forEach(obj => {
      pivotElement = obj.matrix[rowIndex][columnIndex];
      if (pivotElement != null) {
        for (i = 0; i <= obj.matrix[rowIndex].length - 1; i++) {
          obj.matrix[rowIndex][i] /= pivotElement;
        }
      }
      for (i = 0; i <= obj.matrix.length - 1; i++) {
        if (obj.matrix[i][columnIndex] !== 0 && i !== rowIndex) {
          obj.matrix[i][columnIndex] =
            obj.matrix[i][columnIndex] -
            obj.matrix[i][columnIndex] * obj.matrix[rowIndex][columnIndex];
        }
      }
    });
    resolve({
      tableau: tableau,
      columnIndex: columnIndex,
      rowIndex: rowIndex
    });
  });
}

function checkForNegativeValues(tableau, columnIndex, rowIndex) {
  let matrizen = Object.values(tableau);
  matrizen.forEach((obj, i) => {
    let nonNegative = isAllNonNegative(obj.matrix[obj.matrix.length - 1]);
    if (nonNegative) {
      // console.table('POSITIVE:', obj.matrix[obj.matrix.length - 1]);
      pivot(tableAus);
    } else {
      console.table('NEGATIVE:', obj.matrix[obj.matrix.length - 1]);
    }
  });
}

function isAllNonNegative(vector) {
  return vector.reduce((acc, curItem) => acc && curItem >= 0, true);
}

function divideByPivotColumn(tableau, columnIndex) {
  return new Promise(resolve => {
    let matrizen = Object.values(tableau);
    matrizen.forEach(obj => {
      obj.matrix.forEach((row, i) => {
        let division = (row[row.length - 2 - i] / row[columnIndex]).toFixed(2);
        row[row.length - 2 - i] = Number(division);
      });
    });
    resolve({
      tableau: tableau,
      columnIndex: columnIndex
    });
  });
}

simplex();
