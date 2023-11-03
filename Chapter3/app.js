function mostFrequent(arr) {
  let freq = {};
  let maxFreq = 0;
  let maxElem = null;

  for (let elem of arr) {
    if (freq[elem]) {
      freq[elem]++;
    } else {
      freq[elem] = 1;
    }

    if (freq[elem] > maxFreq) {
      maxFreq = freq[elem];
      maxElem = elem;
    }
  }
  return maxElem;
}

const frequently = () => {};
