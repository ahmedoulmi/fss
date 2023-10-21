//exo 1
function getEvenNumbers(arr) {
  const evenNumbers = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) {
      evenNumbers.push(arr[i]);
    }
  }
  return evenNumbers;
}
console.log(getEvenNumbers([1, 2, 3, 4, 5, 6, 7, 8, 9]));
//exo 2
const people = [
  { name: "John", age: 31, email: "john@example.com" },
  { name: "Jane", age: 29, email: "jane@example.com" },
  { name: "Bob", age: 35, email: "bob@example.com" },
  { name: "Alice", age: 27, email: "alice@example.com" },
];

function getPeopleOver30(people) {
  const peopleOver30 = [];
  for (let i = 0; i < people.length; i++) {
    if (people[i].age > 30) {
      peopleOver30.push(people[i]);
    }
  }
  return peopleOver30;
}

console.log(getPeopleOver30(people));
//exo3
function removeVowels(str) {
  const vowels = ["a", "e", "i", "o", "u"];
  return str
    .split("")
    .filter((char) => !vowels.includes(char))
    .join("");
}

console.log(removeVowels("Hello")); // "Hll"
//exo4
function findUniqueElements(arr1, arr2) {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  const uniqueElements = [...set1, ...set2];

  return uniqueElements;
}

console.log(findUniqueElements([1, 2, 3, 4, 5], [3, 4, 5, 6, 7]));
