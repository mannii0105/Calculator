'use strict';

const display    = document.getElementById('display');
const expression = document.getElementById('expression');

let currentInput  = '0';
let previousInput = '';
let operator      = null;
let shouldReset   = false;
let justEvaluated = false;

/* ── Helpers ── */

function updateDisplay(value) {
  display.textContent = value;

  // Scale font for long numbers
  const len = value.replace('-', '').length;
  display.classList.remove('small', 'xsmall');
  if (len > 12) display.classList.add('xsmall');
  else if (len > 9) display.classList.add('small');
}

function setExpression(text) {
  expression.textContent = text;
}

function clearOperatorHighlight() {
  document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('pressed'));
}

function highlightOperator(action) {
  clearOperatorHighlight();
  const btn = document.querySelector(`[data-action="${action}"]`);
  if (btn) btn.classList.add('pressed');
}

function formatResult(num) {
  if (!isFinite(num)) return 'Error';
  // Avoid floating point noise
  const rounded = parseFloat(num.toPrecision(12));
  // If integer, show no decimals; else trim trailing zeros
  return rounded % 1 === 0 ? String(rounded) : String(parseFloat(rounded.toFixed(10)));
}

/* ── Core logic ── */

function inputDigit(digit) {
  if (justEvaluated) {
    currentInput  = digit;
    justEvaluated = false;
    shouldReset   = false;
  } else if (shouldReset) {
    currentInput = digit;
    shouldReset  = false;
  } else {
    currentInput = currentInput === '0' ? digit : currentInput + digit;
  }
  updateDisplay(currentInput);
}

function inputDecimal() {
  if (shouldReset || justEvaluated) {
    currentInput  = '0.';
    shouldReset   = false;
    justEvaluated = false;
    updateDisplay(currentInput);
    return;
  }
  if (!currentInput.includes('.')) {
    currentInput += '.';
    updateDisplay(currentInput);
  }
}

function handleOperator(nextOp) {
  const current = parseFloat(currentInput);

  if (operator && !shouldReset && !justEvaluated) {
    const result = calculate(parseFloat(previousInput), current, operator);
    currentInput = formatResult(result);
    updateDisplay(currentInput);
    setExpression(currentInput + ' ' + symbolFor(nextOp));
    previousInput = currentInput;
  } else {
    previousInput = currentInput;
    setExpression(currentInput + ' ' + symbolFor(nextOp));
  }

  operator      = nextOp;
  shouldReset   = true;
  justEvaluated = false;
  highlightOperator(nextOp);
}

function calculate(a, b, op) {
  switch (op) {
    case 'add':      return a + b;
    case 'subtract': return a - b;
    case 'multiply': return a * b;
    case 'divide':   return b !== 0 ? a / b : Infinity;
    default:         return b;
  }
}

function symbolFor(op) {
  const map = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  return map[op] || '';
}

function handleEquals() {
  if (!operator || shouldReset) return;

  const a = parseFloat(previousInput);
  const b = parseFloat(currentInput);
  const result = calculate(a, b, operator);

  setExpression(previousInput + ' ' + symbolFor(operator) + ' ' + currentInput + ' =');
  currentInput  = formatResult(result);
  updateDisplay(currentInput);
  operator      = null;
  shouldReset   = true;
  justEvaluated = true;
  clearOperatorHighlight();
}

function handleClear() {
  currentInput  = '0';
  previousInput = '';
  operator      = null;
  shouldReset   = false;
  justEvaluated = false;
  updateDisplay('0');
  setExpression('');
  clearOperatorHighlight();
}

function handleSign() {
  if (currentInput === '0') return;
  currentInput = String(parseFloat(currentInput) * -1);
  updateDisplay(currentInput);
}

function handlePercent() {
  const val = parseFloat(currentInput);
  currentInput = formatResult(val / 100);
  updateDisplay(currentInput);
  justEvaluated = false;
}

/* ── Event binding ── */

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const { action, value } = btn.dataset;

    if (value !== undefined) {
      inputDigit(value);
      clearOperatorHighlight();
      return;
    }

    switch (action) {
      case 'decimal':  inputDecimal(); clearOperatorHighlight(); break;
      case 'clear':    handleClear();  break;
      case 'sign':     handleSign();   break;
      case 'percent':  handlePercent(); break;
      case 'equals':   handleEquals(); break;
      default:         handleOperator(action);
    }
  });
});

/* ── Keyboard support ── */
document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') { inputDigit(e.key); clearOperatorHighlight(); }
  else if (e.key === '.')    inputDecimal();
  else if (e.key === '+')    handleOperator('add');
  else if (e.key === '-')    handleOperator('subtract');
  else if (e.key === '*')    handleOperator('multiply');
  else if (e.key === '/')  { e.preventDefault(); handleOperator('divide'); }
  else if (e.key === 'Enter' || e.key === '=') handleEquals();
  else if (e.key === 'Escape' || e.key === 'c') handleClear();
  else if (e.key === '%')    handlePercent();
  else if (e.key === 'Backspace') {
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      updateDisplay(currentInput);
    } else {
      currentInput = '0';
      updateDisplay('0');
    }
  }
});
