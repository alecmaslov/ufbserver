export function generateRandomNumberSet(
    min: number,
    max: number,
    count: number
): number[] {
    // Generate array with all possible numbers
    const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    // Shuffle the array
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers.slice(0, count);
}

export function shuffleArray(array : any[]) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

export function getRandomElements(array: any[], num: number) {
    const copyArray = [...array];
    const randomElements = [];
    for (let i = 0; i < num; i++) {
      const randomIndex = Math.floor(Math.random() * copyArray.length);
      const element = copyArray.splice(randomIndex, 1)[0];
      randomElements.push(element);
    }
    return randomElements;
  }