//exo1
function averageEvenNumbers(arr) {
  const evenNumbers = arr.filter((num) => num % 2 === 0);
  if (evenNumbers.length === 0) {
    return 0;
  }
  const sum = evenNumbers.reduce((acc, num) => acc + num, 0);
  const average = sum / evenNumbers.length;
  return average;
}
console.log(averageEvenNumbers([1, 2, 3, 4, 5, 6, 8, 9, 7, 33, 65]));

//exo2
function longestWord(arr) {
  return arr.reduce((a, b) => {
    if (b.length > a.length) {
      return b;
    }
    return a;
  }, "");
}

console.log(longestWord(["hello", "Ahmed", "algeria"]));
//exo4

function wordFrequency(arr) {
  return arr.reduce((acc, curr) => {
    if (acc[curr]) {
      acc[curr]++;
    } else {
      acc[curr] = 1;
    }
    return acc;
  }, {});
}

console.log(wordFrequency(["hello", "world", "hello"]));
