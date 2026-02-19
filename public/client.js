'use strict';

var value = 0;

var states = {
    "start": 0,
    "operand1": 1,
    "operator": 2,
    "operand2": 3,
    "complete": 4
};

var state = states.start;

var operand1 = 0;
var operand2 = 0;
var operation = null;
var expressionText = '';
var scientificMode = false;
var currentTheme = 'light';

// --- Initialisation ---

function init() {
    setValue(0);
    loadTheme();
    setupThemeButtons();
}

// --- Theme management ---

function loadTheme() {
    var saved = localStorage.getItem('calcTheme') || 'light';
    applyTheme(saved);
}

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calcTheme', theme);
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
}

function setupThemeButtons() {
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            applyTheme(btn.getAttribute('data-theme'));
        });
    });
}

// --- Scientific mode toggle ---

function toggleScientific() {
    scientificMode = !scientificMode;
    var sciPanel = document.getElementById('scientificButtons');
    var calc = document.querySelector('.calculator');
    var toggleBtn = document.getElementById('sciToggle');
    if (scientificMode) {
        sciPanel.style.display = 'grid';
        calc.classList.add('sci-mode');
        toggleBtn.classList.add('active');
    } else {
        sciPanel.style.display = 'none';
        calc.classList.remove('sci-mode');
        toggleBtn.classList.remove('active');
    }
}

// --- Scientific operations (computed client-side) ---

function scientificPressed(fn) {
    var v = parseFloat(getValue());
    var result;

    switch (fn) {
        case 'sin':
            result = Math.sin(v * Math.PI / 180); // degrees
            expressionText = 'sin(' + v + '°)';
            break;
        case 'cos':
            result = Math.cos(v * Math.PI / 180);
            expressionText = 'cos(' + v + '°)';
            break;
        case 'tan':
            result = Math.tan(v * Math.PI / 180);
            expressionText = 'tan(' + v + '°)';
            break;
        case 'sqrt':
            if (v < 0) { setError(); return; }
            result = Math.sqrt(v);
            expressionText = '√(' + v + ')';
            break;
        case 'square':
            result = v * v;
            expressionText = v + '²';
            break;
        case 'log':
            if (v <= 0) { setError(); return; }
            result = Math.log10(v);
            expressionText = 'log(' + v + ')';
            break;
        case 'ln':
            if (v <= 0) { setError(); return; }
            result = Math.log(v);
            expressionText = 'ln(' + v + ')';
            break;
        case 'pi':
            result = Math.PI;
            expressionText = 'π';
            break;
        case 'inverse':
            if (v === 0) { setError(); return; }
            result = 1 / v;
            expressionText = '1/' + v;
            break;
        case 'abs':
            result = Math.abs(v);
            expressionText = '|' + v + '|';
            break;
        default:
            setError();
            return;
    }

    // Round off floating point noise
    result = parseFloat(result.toPrecision(10));
    setValue(result);
    setExpression(expressionText + ' =');
    state = states.complete;
}

// --- Basic calculator ---

function calculate(op1, op2, op) {
    var uri = location.origin + "/arithmetic";

    switch (op) {
        case '+':
            uri += "?operation=add";
            break;
        case '-':
            uri += "?operation=subtract";
            break;
        case '*':
            uri += "?operation=multiply";
            break;
        case '/':
            uri += "?operation=divide";
            break;
        default:
            setError();
            return;
    }

    uri += "&operand1=" + encodeURIComponent(op1);
    uri += "&operand2=" + encodeURIComponent(op2);

    setLoading(true);

    var http = new XMLHttpRequest();
    http.open("GET", uri, true);
    http.onload = function () {
        setLoading(false);

        if (http.status == 200) {
            var response = JSON.parse(http.responseText);
            setValue(response.result);
        } else {
            setError();
        }
    };
    http.send(null);
}

function clearPressed() {
    setValue(0);
    setExpression('');

    operand1 = 0;
    operand2 = 0;
    operation = null;
    state = states.start;
}

function clearEntryPressed() {
    setValue(0);
    state = (state == states.operand2) ? states.operator : states.start;
}

function numberPressed(n) {
    var v = getValue();

    if (state == states.start || state == states.complete) {
        v = n;
        state = (n == '0' ? states.start : states.operand1);
        if (state === states.operand1) setExpression('');
    } else if (state == states.operator) {
        v = n;
        state = (n == '0' ? states.operator : states.operand2);
    } else if (v.toString().replace(/[-\.]/g, '').length < 8) {
        v += n;
    }

    v += "";

    setValue(v);
}

function decimalPressed() {
    if (state == states.start || state == states.complete) {
        setValue('0.');
        state = states.operand1;
        setExpression('');
    } else if (state == states.operator) {
        setValue('0.');
        state = states.operand2;
    } else if (!getValue().toString().includes('.')) {
        setValue(getValue() + '.');
    }
}

function signPressed() {
    var v = getValue();

    if (v != 0) {
        setValue(-1 * v);
    }
}

function percentPressed() {
    var v = parseFloat(getValue());
    if (state == states.operand2 && operand1 !== 0) {
        setValue(v / 100 * parseFloat(operand1));
    } else {
        setValue(v / 100);
    }
}

function operationPressed(op) {
    operand1 = getValue();
    operation = op;
    var opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] || op;
    setExpression(operand1 + ' ' + opSymbol);
    state = states.operator;
}

function equalPressed() {
    if (state < states.operand2) {
        state = states.complete;
        return;
    }

    if (state == states.operand2) {
        operand2 = getValue();
        state = states.complete;
    } else if (state == states.complete) {
        operand1 = getValue();
    }

    var opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[operation] || operation;
    setExpression(operand1 + ' ' + opSymbol + ' ' + operand2 + ' =');
    calculate(operand1, operand2, operation);
}

// --- Keyboard support ---

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' || event.key === 'Delete') {
        clearPressed();
        event.preventDefault();
    } else if (event.key === 'Enter') {
        equalPressed();
        event.preventDefault();
    } else if (event.key === 'Backspace') {
        clearEntryPressed();
        event.preventDefault();
    }
});

document.addEventListener('keypress', function(event) {
    if (event.key.match(/^\d+$/)) {
        numberPressed(event.key);
        event.preventDefault();
    } else if (event.key == '.') {
        decimalPressed();
        event.preventDefault();
    } else if (event.key.match(/^[-*+/]$/)) {
        operationPressed(event.key);
        event.preventDefault();
    } else if (event.key == '=' || event.key == 'Enter') {
        equalPressed();
        event.preventDefault();
    }
});

// --- Display helpers ---

function getValue() {
    return value;
}

function setExpression(text) {
    expressionText = text;
    var el = document.getElementById('expression');
    if (el) el.textContent = text;
}

function setValue(n) {
    value = n;
    var displayValue = value;

    if (displayValue > 99999999) {
        displayValue = displayValue.toExponential(4);
    } else if (displayValue < -99999999) {
        displayValue = displayValue.toExponential(4);
    } else if (displayValue > 0 && displayValue < 0.0000001) {
        displayValue = displayValue.toExponential(4);
    } else if (displayValue < 0 && displayValue > -0.0000001) {
        displayValue = displayValue.toExponential(3);
    }

    var chars = displayValue.toString().split("");
    var html = "";

    for (var c of chars) {
        if (c == '-') {
            html += "<span class=\"resultchar negative\">" + c + "</span>";
        } else if (c == '.') {
            html += "<span class=\"resultchar decimal\">" + c + "</span>";
        } else if (c == 'e') {
            html += "<span class=\"resultchar exponent\">e</span>";
        } else if (c != '+') {
            html += "<span class=\"resultchar digit" + c + "\">" + c + "</span>";
        }
    }

    document.getElementById("result").innerHTML = html;
}

function setError() {
    document.getElementById("result").innerHTML = "ERROR";
}

function setLoading(loading) {
    if (loading) {
        document.getElementById("loading").style.visibility = "visible";
    } else {
        document.getElementById("loading").style.visibility = "hidden";
    }

    var buttons = document.querySelectorAll("BUTTON");

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = loading;
    }
}

