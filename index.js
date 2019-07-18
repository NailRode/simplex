const parse = require('./parse');
const path = require('path');
const fs = require('fs');
const simplex = require('./simplex');
const chalk = require('chalk');

const fileNames = [];
const paths = [];

const startLinearProgramm = () => {
  parseBenchmarks('benchmarks')
    .then(benchmarks => transpose(benchmarks))
    .then(transposedBenchmarks => createTableau(transposedBenchmarks));
};

const parseBenchmarks = async folder => {
  getFileNames(folder);
  fileNames.forEach(name => {
    const bmPath = getPath(folder, name);
    paths.push(bmPath);
  });

  let promises = paths.map(path => parse(path));
  let newBenchmarks = await Promise.all(promises);

  return newBenchmarks;
};

const getFileNames = dirName => {
  fs.readdirSync(dirName).forEach(fileName => {
    fileNames.push(fileName);
  });
};

const getPath = (folder, fileName) => {
  const bmPath = path.join(__dirname, folder, fileName);
  return bmPath;
};

const transpose = benchmarks => {
  return new Promise(resolve => {
    benchmarks.forEach((benchmark, i) => {
      benchmark = benchmarks[i][0].map((col, index) =>
        benchmark.map(row => row[index])
      );
    });
    resolve(benchmarks);
  });
};

const createTableau = transposedBenchmarks => {
  return new Promise(resolve => {
    transposedBenchmarks.forEach((benchmark, i) => {
      addSlackVars(benchmark).then(benchmark => {
        // console.log(chalk.red(i), benchmark);
        simplex(benchmark);
      });
    });
  });
};

const addSlackVars = benchmark => {
  return new Promise(resolve => {
    benchmark.forEach((row, i) => {
      const rightHandSideVal = row.pop();

      const firstZeroArray = new Array(i).fill(0);
      const secondZeroArray = new Array(benchmark.length - i - 1).fill(0);

      const firstRowPart = row;
      let secondRowPart = [...firstZeroArray, 1, ...secondZeroArray];

      benchmark[i] = [...firstRowPart, ...secondRowPart, rightHandSideVal];
      benchmark[benchmark.length - 1][row.length - 2] = 0;
    });
    resolve(benchmark);
  });
};

startLinearProgramm();
