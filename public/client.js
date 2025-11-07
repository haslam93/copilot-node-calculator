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

// Single operand operations that execute immediately
var SINGLE_OPERAND_OPS = ['√', 'sin', 'cos', 'tan', 'log', 'ln'];

function calculate(operand1, operand2, operation) {
    var uri = location.origin + "/arithmetic";

    // TODO: Add operator
    switch (operation) {
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
        case '^':
            uri += "?operation=power";
            break;
        case '√':
            uri += "?operation=sqrt";
            break;
        case 'sin':
            uri += "?operation=sin";
            break;
        case 'cos':
            uri += "?operation=cos";
            break;
        case 'tan':
            uri += "?operation=tan";
            break;
        case 'log':
            uri += "?operation=log";
            break;
        case 'ln':
            uri += "?operation=ln";
            break;
        default:
            setError();
            return;
    }

    uri += "&operand1=" + encodeURIComponent(operand1);
    
    // Only add operand2 for binary operations
    if (!SINGLE_OPERAND_OPS.includes(operation)) {
        uri += "&operand2=" + encodeURIComponent(operand2);
    }

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
    var value = getValue();

    if (state == states.start || state == states.complete) {
        value = n;
        state = (n == '0' ? states.start : states.operand1);
    } else if (state == states.operator) {
        value = n;
        state = (n == '0' ? states.operator : states.operand2);
    } else if (value.replace(/[-\.]/g, '').length < 8) {
        value += n;
    }

    value += "";

    setValue(value);
}

function decimalPressed() {
    if (state == states.start || state == states.complete) {
        setValue('0.');
        state = states.operand1;
    } else if (state == states.operator) {
        setValue('0.');
        state = states.operand2;
    } else if (!getValue().toString().includes('.')) {
        setValue(getValue() + '.');
    }
}

function signPressed() {
    var value = getValue();

    if (value != 0) {
        setValue(-1 * value);
    }
}

function operationPressed(op) {
    operand1 = getValue();
    operation = op;
    state = states.operator;
}

function scientificPressed(op) {
    // Single operand operations execute immediately
    if (SINGLE_OPERAND_OPS.includes(op)) {
        operand1 = getValue();
        calculate(operand1, null, op);
        state = states.complete;
    }
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

    calculate(operand1, operand2, operation);
}

// Enhanced keyboard support
document.addEventListener('keydown', (event) => {
    // Handle keydown for special keys
    if (event.key === 'Escape' || event.key === 'Delete') {
        clearPressed();
        event.preventDefault();
    } else if (event.key === 'Enter') {
        equalPressed();
        event.preventDefault();
    } else if (event.key === 'Backspace') {
        clearPressed(); // Could be modified to clear entry instead
        event.preventDefault();
    }
});

document.addEventListener('keypress', (event) => {
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

// Add visual feedback for button presses
function addButtonFeedback(buttonSelector) {
    const button = document.querySelector(buttonSelector);
    if (button) {
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 150);
    }
}

function getValue() {
    return value;
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

function setError(n) {
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
