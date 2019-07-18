const { createInterface } = require('readline');
const { createReadStream } = require('fs');

const parse = async path => {
  let benchmark = {};

  let objectiveFunction = await readObjectiveFunction(path);
  benchmark = await readConstraints(path, objectiveFunction);

  return benchmark;
};

const readObjectiveFunction = path => {
  let objectiveFunction = [];
  let singleLine;

  let lineReader = createInterface({
    input: createReadStream(path)
  });
  return new Promise(resolve => {
    lineReader.on('line', line => {
      if (line.includes('min:')) {
        singleLine = line.substring(line.indexOf(':') + 3, line.indexOf(';'));
        singleLine = singleLine.replace(/\*x[0-9]{1,2}/g, '');
        objectiveFunction.push(singleLine);
        objectiveFunction = singleLine
          .trim()
          .split('+')
          .map(element => Number(element));
        objectiveFunction.push(0);
      }
    });
    lineReader.on('close', () => {
      resolve(objectiveFunction);
    });
  });
};

const readConstraints = (path, objectiveFunction) => {
  let matrix = [];
  let singleLine;
  let lineReader = createInterface({
    input: createReadStream(path)
  });

  return new Promise(resolve => {
    lineReader.on('line', line => {
      if (line.includes('>=')) {
        singleLine = line.substring(line.indexOf('+') + 1, line.indexOf(';'));
        singleLine = singleLine.replace('>=', '+');
        singleLine = singleLine.replace(/\*x[0-9]{1,2}/g, '');
        singleLine = singleLine
          .trim()
          .split('+')
          .map(element => Number(element));
        matrix.push(singleLine);
      }
    });
    lineReader.on('close', () => {
      matrix.push(objectiveFunction);
      resolve(matrix);
    });
  });
};

module.exports = parse;
