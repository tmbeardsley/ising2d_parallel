// Programatically creates the input fields and performs validation of input data
'use strict';

// Attributes for each label and input field. Includes validation functions that should be applied to inputs.
let inputElements = [

    { 'element': 'label', 'tagAttr': { 'tooltip-data': '# lattice sites in the x-direction', 'for': 'input_Nx', 'class': 'sglInputLbl tooltip' }, 'innerData': { 'innerText': 'Nx:' } },
    { 'var': 'Nx', 'element': 'input', 'tagAttr': { 'type': 'number', 'id': 'input_Nx', 'class': 'sglInputField', 'value': 20, 'min': 3, 'max': 100, 'step': 1 }, 'funcs': { 'input_NxFO': ['focusout', 'change'] } },
    { 'element': 'br' },

    { 'element': 'label', 'tagAttr': { 'for': 'input_Ny', 'class': 'sglInputLbl tooltip', 'tooltip-data': '# lattice sites in the y-direction' }, 'innerData': { 'innerText': 'Ny:' } },
    { 'var': 'Ny', 'element': 'input', 'tagAttr': { 'type': 'number', 'id': 'input_Ny', 'class': 'sglInputField', 'value': 20, 'min': 3, 'max': 100, 'step': 1, 'disabled': true }, 'funcs': { 'IntTextFO': ['focusout', 'change'] } },
    { 'element': 'br' },

    { 'element': 'label', 'tagAttr': { 'for': 'input_neq', 'class': 'sglInputLbl tooltip', 'tooltip-data': '# equilibration steps per lattice site before gathering statistics' }, 'innerData': { 'innerText': 'neq:' } },
    { 'var': 'neq', 'element': 'input', 'tagAttr': { 'type': 'number', 'id': 'input_neq', 'class': 'sglInputField', 'value': 100000, 'min': 1000, 'max': 1000000, 'step': 1000 }, 'funcs': { 'IntTextFO': ['focusout', 'change'] } },
    { 'element': 'br' },

    { 'element': 'label', 'tagAttr': { 'for': 'input_nst', 'class': 'sglInputLbl tooltip', 'tooltip-data': '# steps per lattice site over which statistics are gathered' }, 'innerData': { 'innerText': 'nst:' } },
    { 'var': 'nst', 'element': 'input', 'tagAttr': { 'type': 'number', 'id': 'input_nst', 'class': 'sglInputField', 'value': 100000, 'min': 1000, 'max': 1000000, 'step': 1000 }, 'funcs': { 'IntTextFO': ['focusout', 'change'] } },
    { 'element': 'br' },

    { 'element': 'label', 'tagAttr': { 'for': 'input_fs', 'class': 'sglInputLbl tooltip', 'tooltip-data': '# steps per lattice site between sampling thermodynamic quantities' }, 'innerData': { 'innerText': 'fs:' } },
    { 'var': 'fs', 'element': 'input', 'tagAttr': { 'type': 'number', 'id': 'input_fs', 'class': 'sglInputField', 'value': 10, 'min': 1, 'max': 1000000, 'step': 10 }, 'funcs': { 'IntTextFO': ['focusout', 'change'] } },
    { 'element': 'br' },

    { 'element': 'label', 'tagAttr': { 'for': 'input_fo', 'class': 'sglInputLbl tooltip', 'tooltip-data': '# steps per lattice site between showing outputs (too low of a number inhibits performance)' }, 'innerData': { 'innerText': 'fo:' } },
    { 'var': 'fo', 'element': 'input', 'tagAttr': { 'type': 'number', 'id': 'input_fo', 'class': 'sglInputField', 'value': 1000, 'min': 1, 'max': 1000000, 'step': 1000 }, 'funcs': { 'IntTextFO': ['focusout', 'change'] } },
    { 'element': 'br' },

    { 'element': 'label', 'tagAttr': { 'for': 'input_sqChk' }, 'innerData': { 'innerText': 'square lattice: ' } },
    { 'var': 'fo', 'element': 'input', 'tagAttr': { 'type': 'checkbox', 'id': 'input_sqChk', 'checked': true }, 'funcs': { 'chkChg': ['change'] } },
    { 'element': 'br' },

    { 'element': 'label', 'tagAttr': { 'id': 'kT_JsLbl', 'for': 'input_eps', 'class': 'sglInputLbl tooltip', 'tooltip-data': 'dimensionless temperatures at which to run the current parameter set (comma separated).' }, 'innerData': { 'innerText': 'kT/J:' } },
    { 'element': 'br' },
    { 'var': 'kT_Js', 'element': 'textarea', 'tagAttr': { 'wrap': 'hard', 'id': 'input_eps', 'class': 'multiInputField' }, 'innerData': { 'value': '2.174, 2.222, 2.247, 2.260, 2.273, 2.286, 2.299, 2.326, 2.381, 2.439' }, 'funcs': { 'input_epsFO': ['focusout'] } },
    { 'element': 'br' },

    { 'element': 'button', 'tagAttr': { 'id': 'validate_btn' }, 'innerData': { 'innerText': 'Set experiment' } }
];


// Uses the attributes in inputElements[] to create the input fields for simulation parameters.
function setupInputFields(div_root_hdl) {

    // set up the single-value input fields and labels
    for (let i = 0; i < inputElements.length; i++) {
        let fieldData = inputElements[i];

        // skip to next entry if no element key exists
        if (!('element' in fieldData)) continue;

        // Create the html element
        let ipt = document.createElement(fieldData['element']);      

        // Add element properties
        if ('tagAttr' in fieldData) {
            let tagAttr = fieldData['tagAttr'];
            for (let propName in tagAttr) {
                ipt.setAttribute(propName, tagAttr[propName]);
            }

            // Add event listeners corresponding to any specified validation functions
            if ('funcs' in fieldData) {
                addListeners(ipt, fieldData['funcs'], 'IntTextFO', tagAttr['id'], tagAttr['min'], tagAttr['max']);
                addListeners(ipt, fieldData['funcs'], 'input_NxFO', tagAttr['min'], tagAttr['max']);
                addListeners(ipt, fieldData['funcs'], 'input_epsFO');

                // Make sure input field for Ny exists before trying to apply chkChg function that references it
                let NyFound = inputElements.find((element) => element['var'] == 'Ny');
                if (!NyFound) { throw new Error("ERROR: Couldn't find Ny"); }
                addListeners(ipt, fieldData['funcs'], 'chkChg', NyFound['tagAttr']['min'], NyFound['tagAttr']['max']);
            }
        }

        // Apply innertext for labels
        if ('innerData' in fieldData) {
            let tagInnerData = fieldData['innerData'];
            for (let innerDataName in tagInnerData) {
                ipt[innerDataName] = tagInnerData[innerDataName];
            }
        }

        // Append the input element to the root node
        div_root_hdl.appendChild(ipt);
    }
}


// Add event listener to run the function specified in inputElements[].
// Note: number of arguments received is variable as difference functions require different arguments.
function addListeners() {
    // Receive arguments: InputFieldHdl, funcs[], f, args
    let ipt = arguments[0];
    let funcs = arguments[1];
    let f = arguments[2];
    // Remaining arguments pass to addListeners() function
    const args = Array.prototype.slice.call(arguments, 3);

    // Add the even listeners that run the specified function: f(args)
    if (f in funcs) {
        // Loop through each of the event listeners to which f(args) should be applied
        for (let i = 0; i < funcs[f].length; i++) {
            let eventDesc = funcs[f][i];
            // USING: window["functionName"](arguments) to run function using name
            ipt.addEventListener(eventDesc, () => window[f].apply(window, args));
        }
    }
}


// Returns object if all single-input fields are valid, null otherwise
function getNonTInputs() {
    let obj = {};

    // Get all input field rows with class = 'sglInputField' from inputElements[] for validation.
    // Store identified rows in results[].
    let results = inputElements.filter(obj => {
        try {
            return obj['tagAttr']['class'] == 'sglInputField';
        }
        catch (err) {
            return false;
        }
    });

    // Test the value in each identified field. If it's a valid value, store it in obj[].
    for (let i = 0; i < results.length; i++) {
        let fieldId = results[i]['tagAttr']['id'];
        let fieldVar = results[i]['var'];
        let min = results[i]['tagAttr']['min'];
        let max = results[i]['tagAttr']['max'];
        if (!isValidNonTInput(fieldId, min, max)) return null;
        else obj[fieldVar] = parseInt(document.getElementById(fieldId).value);
    }
    return obj;
}


// Returns true if a partcular single-input field is valid (value within its specified range), false otherwise
function isValidNonTInput(id, min, max) {
    let id_hdl = document.getElementById(id);
    let val = id_hdl.value;
    if (!isInt(val) || (parseInt(val) < min) || (parseInt(val) > max)) return false;
    return true;
}


// returns array if string is correctly parsed by delimeter, null otherwise
function parseFloatsString(str, delim) {
    if (str == '') return null;

    // Remove whitespace
    let strNWS = str.replace(/\s/g, '');

    // Split by delimiter (results in array)
    let tmp_arr = strNWS.split(delim);

    // Validate values
    for (let i = 0; i < tmp_arr.length; i++) {
        if (tmp_arr[i] == "") return null;
        if (!isNaN(Number(tmp_arr[i]))) tmp_arr[i] = Number(tmp_arr[i]);
        else return null;
    }
    return tmp_arr;
}


// On focusOut, sets the border colour of input_eps textbox to red if input validation fails
function input_epsFO() {
    let input_eps_hdl = document.getElementById('input_eps');
    let bc = null;
    if (parseFloatsString(input_eps_hdl.value, ',') === null) bc = 'red';
    input_eps_hdl.style.borderColor = bc;
}


// On focusOut, sets the border colour of the element identified by id to red if input validation fails (integers)
function IntTextFO(id, min, max) {
    let id_hdl = document.getElementById(id);
    let val = id_hdl.value;
    if (!isValidNonTInput(id, min, max)) id_hdl.style.borderColor = 'red';
    else id_hdl.style.borderColor = null;
}


// On changing the square lattice checkbox state, either sets the value of Ny = Nx (checked),
// or allows Ny to be edited (unchecked). Validates the value of Ny at the end of the function.
function chkChg(ymin, ymax) {
    let checked = document.getElementById('input_sqChk').checked;
    let input_Nx_hdl = document.getElementById('input_Nx');
    let input_Ny_hdl = document.getElementById('input_Ny');

    if (checked) {
        input_Ny_hdl.value = input_Nx_hdl.value;
        input_Ny_hdl.disabled = true;
    }
    else {
        input_Ny_hdl.disabled = false;
    }
    IntTextFO('input_Ny', ymin, ymax);
}


// Special case of focus out for the Nx input field. 
// Runs validation on Nx. Also validates Ny if the square lattice checkbox is checked.
function input_NxFO(min, max) {
    IntTextFO('input_Nx', min, max);

    if (document.getElementById('input_sqChk').checked) {
        document.getElementById('input_Ny').value = document.getElementById('input_Nx').value;
        IntTextFO('input_Ny', min, max);
    }
}


// Returns true if value is integer, false otherwise
function isInt(value) {
    return /^[1-9]\d*$/.test(value)
}


// Returns null if any invalid data in encountered in the input fields.
// Returns an object of input parameters and reduced temperatures if fields are validated.
function getValidatedInputData(delim) {
    // get integer inputs not related to temperature. Null if validation failed.
    let expInputs = getNonTInputs();

    // parse and validate the temperature input (comma delimited). Null if validation failed
    let arr = new Array();
    arr = parseFloatsString(document.getElementById('input_eps', ',').value, delim);

    if ((arr === null) || (expInputs === null)) {
        return null;
    } else {
        return { 'params': expInputs, 'kT_Js': arr };
    }
}


