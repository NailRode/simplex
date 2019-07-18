const { createInterface } = require('readline');
const { createReadStream } = require('fs');

async function parse(path) {
  let fileName = path.substring(path.lastIndexOf('/') + 1, path.indexOf('.'));
  let benchmark = {
    [fileName]: {}
  };

  let objectiveFunction = await readObjectiveFunction(path);
  benchmark[fileName].lastColumn = await readLastColumns(path);
  benchmark[fileName].matrix = await readConstraints(path, objectiveFunction);

  return benchmark;
}

function readLastColumns(path) {
  let values = [];
  let value;

  let lineReader = createInterface({
    input: createReadStream(path)
  });

  return new Promise(resolve => {
    lineReader.on('line', line => {
      if (line.includes('>=')) {
        value = line.substring(line.indexOf('>=') + 3, line.indexOf(';'));
        values.push(Number(value));
      }
    });
    lineReader.on('close', () => {
      resolve(values);
    });
  });
}

function readObjectiveFunction(path) {
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
}

function readConstraints(path, objectiveFunction) {
  let matrix = [];
  let singleLine;
  let lineReader = createInterface({
    input: createReadStream(path)
  });

  matrix.push(objectiveFunction);

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
      resolve(matrix);
    });
  });
}

module.exports = parse;
