let arr = [];
let arr1 = [1, 2, 3, 4, 5];
console.log(arr1.length);
console.log(arr1[0]);
console.log(arr1[Math.floor(arr1.length / 2)]);
console.log(arr1[arr1.length - 1]);
let mixedDataTypes = [1, "a", "b", "c", 2, 3];
console.log(mixedDataTypes);
let itCompanies = [
  "Facebook",
  "Google",
  "Microsoft",
  "Apple",
  "IBM",
  "Oracle",
  "Amazon",
];
console.log(itCompanies);
console.log(itCompanies.length);
console.log(itCompanies[0]);
console.log(itCompanies[Math.floor(itCompanies.length / 2)]);
console.log(itCompanies[itCompanies.length - 1]);
for (let i = 0; i < itCompanies.length; i++) {
  console.log(itCompanies[i].toUpperCase());
}
//12
console.log(itCompanies.join(", ") + "good company");
//13
function exist(company) {
  for (let j = 0; j < itCompanies.length; j++) {
    if (company == itCompanies[j]) {
      return "the company exist";
    } else {
      return "the company not exist";
    }
  }
}
console.log(exist("Facebook"));
console.log(exist("ali"));
//14
for (let i = 0; i < itCompanies.length; i++) {
  let result = 0;
  for (let j = 0; j < itCompanies[i].length; j++) {
    if (itCompanies[i][j] == "o") {
      result++;
    }
  }
  if (result > 1) {
    console.log(itCompanies[i] + " contient double O");
  }
}
//15

console.log(itCompanies.sort());

//16
console.log(itCompanies.reverse());
//17

console.log(itCompanies.slice(2));
//18
console.log(itCompanies.slice(4, 7));
console.log(itCompanies.slice(Math.floor(itCompanies.length / 2), 6));
//20
console.log(itCompanies.slice(1, itCompanies.length));
//21

console.log(itCompanies.splice(Math.floor(itCompanies.length / 2), 1));
//22

console.log(itCompanies.splice(itCompanies.length - 1, 1));

//23

console.log(itCompanies.splice(0, itCompanies.length));
