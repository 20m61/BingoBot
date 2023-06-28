import React, { useState } from 'react';

function useLocalStorage(key: string, initialValue: never[]) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item).map(Number) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: (arg0: any) => any) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

function BingoApp() {
  const [calledNumbers, setCalledNumbers] = useLocalStorage(
    'calledNumbers',
    []
  );
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [readingNumber, setReadingNumber] = useState<number | null>(null);

  const generateNumber = () => {
    let newNumber;
    do {
      newNumber = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(newNumber));
    setCalledNumbers([...calledNumbers, newNumber]);
    setCurrentNumber(newNumber);

    // Read out the number
    if (isPrime(newNumber)) {
      const primeUtterance = new SpeechSynthesisUtterance('これは素数ですね');
      primeUtterance.rate = 0.8;
      window.speechSynthesis.speak(primeUtterance);
    }
    const utterance = new SpeechSynthesisUtterance(String(newNumber));
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const resetNumbers = () => {
    setCalledNumbers([]);
    setCurrentNumber(null);
  };

  const isPrime = (num: number) => {
    for (let i = 2, sqrt = Math.sqrt(num); i <= sqrt; i++)
      if (num % i === 0) return false;
    return num > 1;
  };

  const readNumbers = () => {
    let i = 0;
    const sortedNumbers = [...calledNumbers].sort((a, b) => a - b);
    const readNextNumber = () => {
      if (i < sortedNumbers.length) {
        const number = sortedNumbers[i];
        if (isPrime(number)) {
          const primeUtterance = new SpeechSynthesisUtterance(
            'これは素数ですね'
          );
          primeUtterance.rate = 0.8;
          window.speechSynthesis.speak(primeUtterance);
        }
        setReadingNumber(number);
        const utterance = new SpeechSynthesisUtterance(String(number));
        utterance.rate = 0.8;
        utterance.onend = () => {
          setReadingNumber(null);
          i++;
          readNextNumber();
        };
        window.speechSynthesis.speak(utterance);
        if (i !== sortedNumbers.length - 1) {
          const nextUtterance = new SpeechSynthesisUtterance('続いて');
          nextUtterance.rate = 0.8;
          window.speechSynthesis.speak(nextUtterance);
        }
      }
    };
    readNextNumber();
  };

  const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

  return (
    <div>
      <button onClick={generateNumber}>Generate Number</button>
      <button onClick={resetNumbers}>Reset Numbers</button>
      <button onClick={readNumbers}>Read Numbers</button>
      {currentNumber && <p>Current Number: {currentNumber}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {numbers.map((number) => (
          <div
            key={number}
            style={{
              width: '10%',
              backgroundColor: calledNumbers.includes(number)
                ? 'red'
                : 'transparent',
              fontSize: number === readingNumber ? '2em' : '1em',
            }}
          >
            {number}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BingoApp;
