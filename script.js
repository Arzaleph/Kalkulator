const display = document.getElementById('display');
const historyDisplay = document.getElementById('history-display');
const historyList = document.getElementById('history-list');
const memoryList = document.getElementById('memory-list');
const buttons = document.getElementById('buttons');

let currentInput = '0';
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;
let history = [];
let memory = [];
let tokens = [];

const OPERATOR_MAP = {
    'add': ' + ',
    'subtract': ' - ',
    'multiply': ' x ',
    'divide': ' ÷ '
};

function rebuildCalculationString() {
    return tokens.join('');
}

function updateDisplay() {
    display.innerText = currentInput;
    historyDisplay.innerText = rebuildCalculationString();
}

function pushNumberToken(num) {
    if (tokens.length === 0) {
        tokens.push(num);
    } else {
        const last = tokens[tokens.length - 1];
        if (last === OPERATOR_MAP.add || last === OPERATOR_MAP.subtract || last === OPERATOR_MAP.multiply || last === OPERATOR_MAP.divide) {
            tokens.push(num);
        } else {
            tokens[tokens.length - 1] = last + num;
        }
    }
}

function replaceLastNumberToken(num) {
    if (tokens.length === 0) {
        tokens.push(num);
    } else {
        const last = tokens[tokens.length - 1];
        if (last === OPERATOR_MAP.add || last === OPERATOR_MAP.subtract || last === OPERATOR_MAP.multiply || last === OPERATOR_MAP.divide) {
            tokens.push(num);
        } else {
            tokens[tokens.length - 1] = num;
        }
    }
}

function inputDigit(digit) {
    if (waitingForSecondOperand) {
        currentInput = digit;
        waitingForSecondOperand = false;
        pushNumberToken(digit);
        updateDisplay();
        return;
    }

    if (currentInput.length >= 18) return;
    currentInput = currentInput === '0' ? digit : currentInput + digit;
    replaceLastNumberToken(currentInput);
    updateDisplay();
}

function inputDecimal(dot) {
    if (waitingForSecondOperand) {
        currentInput = '0.';
        waitingForSecondOperand = false;
        pushNumberToken(currentInput);
        updateDisplay();
        return;
    }

    if (!currentInput.includes(dot)) {
        currentInput += dot;
        replaceLastNumberToken(currentInput);
    }
    updateDisplay();
}

function clearAll() {
    currentInput = '0';
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    tokens = [];
    updateDisplay();
}

function clearEntry() {
    currentInput = '0';
    if (tokens.length === 0) {
        tokens = [];
        calculationEmpty();
    } else {
        const last = tokens[tokens.length - 1];
        if (last === OPERATOR_MAP.add || last === OPERATOR_MAP.subtract || last === OPERATOR_MAP.multiply || last === OPERATOR_MAP.divide) {
            tokens.pop();
        } else {
            tokens[tokens.length - 1] = '0';
        }
    }
    updateDisplay();
}

function calculationEmpty() {
    tokens = [];
}

function performCalculation(op1, op2, op) {
    op1 = parseFloat(op1);
    op2 = parseFloat(op2);
    switch (op) {
        case 'add': return op1 + op2;
        case 'subtract': return op1 - op2;
        case 'multiply': return op1 * op2;
        case 'divide': return op2 === 0 ? 'Error: Tidak bisa membagi dengan 0' : op1 / op2;
        default: return op2;
    }
}

function handleOperator(nextOperator) {
    const operatorSymbol = OPERATOR_MAP[nextOperator];
    const inputValue = parseFloat(currentInput);

    if (operator && waitingForSecondOperand) {
        if (tokens.length > 0) {
            tokens[tokens.length - 1] = operatorSymbol;
            operator = nextOperator;
            updateDisplay();
            return;
        }
    }

    if (firstOperand === null) {
        firstOperand = inputValue;
    } else if (operator && !waitingForSecondOperand) {
        const result = performCalculation(firstOperand, inputValue, operator);
        if (typeof result === 'string') {
            currentInput = result;
            firstOperand = null;
            operator = null;
            waitingForSecondOperand = true;
            tokens = [result];
            updateDisplay();
            return;
        }
        firstOperand = result;
        currentInput = String(result);
        // Baris ini dihapus/dikomentari untuk mencegah hasil sementara mengganti token riwayat
        // replaceLastNumberToken(currentInput);
    } else if (!operator && tokens.length >= 1 && !waitingForSecondOperand) {
        firstOperand = parseFloat(currentInput);
    }

    operator = nextOperator;
    waitingForSecondOperand = true;

    if (tokens.length === 0) {
        tokens.push(String(currentInput));
        tokens.push(operatorSymbol);
    } else {
        const last = tokens[tokens.length - 1];
        if (last === OPERATOR_MAP.add || last === OPERATOR_MAP.subtract || last === OPERATOR_MAP.multiply || last === OPERATOR_MAP.divide) {
            tokens[tokens.length - 1] = operatorSymbol;
        } else {
            tokens.push(operatorSymbol);
        }
    }

    updateDisplay();
}

function calculate() {
    if (tokens.length === 0) return;
    if (operator === null) return;

    const lastToken = tokens[tokens.length - 1];
    if (lastToken === OPERATOR_MAP.add || lastToken === OPERATOR_MAP.subtract || lastToken === OPERATOR_MAP.multiply || lastToken === OPERATOR_MAP.divide) return;

    const secondOperand = parseFloat(currentInput);
    const result = performCalculation(firstOperand === null ? secondOperand : firstOperand, secondOperand, operator);

    if (typeof result === 'string') {
        currentInput = result;
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = true;
        tokens = [result];
        updateDisplay();
        return;
    }

    addToHistory(rebuildCalculationString() + ' =', result);

    currentInput = String(result);
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = true;
    tokens = [currentInput];
    updateDisplay();
}

function addToHistory(expression, result) {
    history.unshift({ expression, result: result.toFixed(4) });
    if (history.length > 5) history.pop();
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<li class="text-gray-500 italic">Masih Kosong</li>';
        return;
    }
    history.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between border-b border-gray-100 py-1 last:border-b-0';
        li.innerHTML = `
            <span class="text-gray-700">${item.expression}</span>
            <span class="history-result text-indigo-600 font-semibold">${item.result}</span>
        `;
        historyList.appendChild(li);
    });
}

function handleMemory(action) {
    const currentValue = parseFloat(currentInput);
    if (isNaN(currentValue) && action !== 'mRecall' && action !== 'mClear') return;

    switch (action) {
        case 'mClear':
            if (memory.length > 0) memory.pop();
            break;
        case 'mRecall':
            if (memory.length > 0) {
                currentInput = String(memory[memory.length - 1].value);
                waitingForSecondOperand = false;
                replaceLastNumberToken(currentInput);
            }
            break;
        case 'mPlus':
            if (memory.length > 0) memory[memory.length - 1].value += currentValue;
            else memory.push({ id: Date.now(), value: currentValue });
            waitingForSecondOperand = true;
            break;
        case 'mMinus':
            if (memory.length > 0) memory[memory.length - 1].value -= currentValue;
            else memory.push({ id: Date.now(), value: -currentValue });
            waitingForSecondOperand = true;
            break;
    }
    updateDisplay();
    renderMemory();
}

function clearMemoryList() {
    memory = [];
    renderMemory();
}

function recallMemory(id) {
    const item = memory.find(m => m.id === id);
    if (item) {
        currentInput = String(item.value);
        waitingForSecondOperand = false;
        replaceLastNumberToken(currentInput);
        updateDisplay();
    }
}

function clearSingleMemory(id) {
    memory = memory.filter(m => m.id !== id);
    renderMemory();
}

function renderMemory() {
    memoryList.innerHTML = '';
    if (memory.length === 0) {
        memoryList.innerHTML = '<li class="text-gray-500 italic">Masih Kosong</li>';
        return;
    }
    memory.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center border-b border-gray-100 py-1 last:border-b-0';
        li.innerHTML = `
            <span>M${index + 1}:</span>
            <span class="text-green-600 font-semibold">${item.value.toFixed(4)}</span>
            <div class="space-x-1">
                <button onclick="recallMemory(${item.id})" class="bg-indigo-400 hover:bg-indigo-500 text-white text-xs py-1 px-2 rounded transition">MR</button>
                <button onclick="clearSingleMemory(${item.id})" class="bg-red-400 hover:bg-red-500 text-white text-xs py-1 px-2 rounded transition">MC</button>
            </div>
        `;
        memoryList.appendChild(li);
    });
}

buttons.addEventListener('click', (event) => {
    const { target } = event;
    if (!target.matches('button')) return;

    if (target.classList.contains('number-btn')) inputDigit(target.dataset.value);
    else if (target.classList.contains('decimal-btn')) inputDecimal(target.dataset.value);
    else if (target.classList.contains('operator-btn')) handleOperator(target.dataset.operator);
    else if (target.classList.contains('equals-btn')) calculate();
    else if (target.classList.contains('control-btn')) {
        const action = target.dataset.action;
        if (action === 'clearAll') clearAll();
        if (action === 'clearEntry') clearEntry();
    } else if (target.classList.contains('memory-btn')) handleMemory(target.dataset.action);
});

document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key >= '0' && key <= '9') inputDigit(key);
    else if (key === '.') inputDecimal(key);
    else if (['+', '-', '*', '/'].includes(key)) {
        event.preventDefault();
        let operatorKey = key === '+' ? 'add'
                        : key === '-' ? 'subtract'
                        : key === '*' ? 'multiply'
                        : 'divide';
        handleOperator(operatorKey);
    } else if (key === '=' || key === 'Enter') {
        event.preventDefault();
        calculate();
    } else if (key === 'c' || key === 'C') clearAll();
    else if (key === 'Backspace') clearEntry();
});

updateDisplay();
renderHistory();
renderMemory();