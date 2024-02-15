"use strict";

// dynamically add the input fields
setupInputFields(document.getElementById('inputFields'));

// firefox fudge
document.getElementById('dwnld').disabled = true;

// handle of root element of collapsible tree
let treeRoot = document.getElementById('exp_tree');

// an array holding input parameter objects (many experiments)
let expArr = new Array();

// increments every time a new experiment is added for uniqueness
let nextExpId = 0;

// Names of quantities returned by the Ising model simulation
const rsltNames = ['M', 'UL', 'Cv', 'chi', 'H'];

// Titles for quantities returned by the Ising model simulation
const titleNames = ['&lt;M&gt;/N', 'UL', 'CvJ<sup>2</sup>/kN', '&chi;J/N', '&lt;H&gt;/NkT'];

// Object to hold chart configurations
let _graphsObj = emptyGraphsObj(rsltNames);

// Create and add charts to the graphsObj object
createCharts(_graphsObj);

// Make the charts hidden initially (only run this after createCharts)
hideCharts(rsltNames);

let coll = document.getElementsByClassName("collapsible");
for (let i = 0; i < coll.length; i++) {
    coll[i].nextElementSibling.style.display = "block"; // default value of content
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}

// get the width of the inputs div once it's opened
window.requestAnimationFrame(() => {
    let w = document.getElementById('inputFields').offsetWidth;
    document.getElementById('paramsBtn').style.width = w + 'px';
});

// Add event listener for the validate button
document.getElementById("validate_btn").addEventListener("click", () => { validateAndProceed(_graphsObj); });

// A variable to hold download URL for Ising data
let dataObjURL = null;

// Set up checkbox listeners
chkChartListeners(rsltNames);


// set display:none and visibility:visible
// (charts are intitially diplayed and invisible so they render properly)
function hideCharts(qtyNames) {
    for (let i = 0; i < qtyNames.length; i++) {
        let chartCanv_hdl = document.getElementById('chartCanv' + qtyNames[i]);
        chartCanv_hdl.style.display = 'none';
        chartCanv_hdl.style.visibility = 'visible';
    }
}


// Set up chart show/hide listeners for checkboxes
function chkChartListeners(qtyNames) {
    for (let i = 0; i < qtyNames.length; i++) {
        let chk_hdl = document.getElementById('chkChart' + qtyNames[i]);
        let chartCanv_hdl = document.getElementById('chartCanv' + qtyNames[i]);
        chk_hdl.addEventListener('change', () => {
            if (chk_hdl.checked) {
                chartCanv_hdl.style.display = 'inline';
            } else {
                chartCanv_hdl.style.display = 'none';
            }
        });
    }
}


// If user inputted parameters are valid, then set up a new experiment object and associated
// output fields ready for the simulation to be run.
function validateAndProceed(graphsObj = null) {
    let expObj = getValidatedInputData(',');

    // test to make sure input was valid
    if (!expObj) { alert("Error: Input validation failed."); return; }

    // Determine number of required wws from validated temperature array length
    let len = expObj['kT_Js'].length;

    // Add an empty array of webworkers to the object
    expObj['wws'] = new Array(len);

    // Add an empty array of results objects to the object
    expObj['results'] = new Array(len);

    // Add an array to hold handles to an opened animation window
    expObj['winHdls'] = new Array(len);

    // Add an array to hold a lattice for each web worker
    expObj['lattices'] = new Array(len);

    // Give the experiment a unique numerical id and increment it
    expObj['expId'] = nextExpId++;

    // Will hold simulation progress, such as current Monte Carlo step, for each worker
    expObj['progress'] = {};
    expObj['progress']['mcs'] = new Array(len);
    for (let i = 0; i < len; i++) expObj['progress']['mcs'][i] = -expObj['params']['neq']; // required for total prog bar to work correctly.
    expObj['progress']['done'] = new Array(len);

    // Add an object to contain chart arrays
    expObj['chartData'] = {};
    for (let i = 0; i < rsltNames.length; i++) {
        expObj['chartData'][rsltNames[i]] = createChartArray(expObj['kT_Js'], null);
    }

    // Add the experiment object to the experiments array
    expArr.push(expObj);

    // Add branch to the tree for the current experiment
    setupExpOutput(treeRoot, expObj['expId'], expObj['kT_Js'].length, rsltNames, titleNames);

    // Display temperatures on the experiment's output data grid
    for (let wwId = 0; wwId < expObj['kT_Js'].length; wwId++) {
        document.getElementById(kT_JGridId(expObj['expId'], wwId)).innerText = parseFloat(expObj['kT_Js'][wwId]).toFixed(4);
    }

    // Set up the click listener this experiment's run button
    setRunExpBtnListener(expObj['expId'], graphsObj);

    // Change the experiments title
    let titleSpan_hdl = document.getElementById('expTitleSpan');
    titleSpan_hdl.style.display = "none";

    // Enable the download data button
    document.getElementById('dwnld').disabled = false;

    // Allow the width of the experiments div to rescale (after fixing the width in code earlier)
    document.getElementById('expDiv').style.width = "auto";
}


// Set up a click listener for a particular experiment's run button
function setRunExpBtnListener(expId, graphsObj = null) {
    let btn_hdl = document.getElementById(getRunBtnId(expId));
    btn_hdl.addEventListener('click', () => runOrStopExp(expId, btn_hdl, graphsObj));
}


// Run or stop experiment depending on button state
function runOrStopExp(expId, btn_hdl, graphsObj = null) {
    // Find the experiment object with 'expId' = expId
    let expObj = getExpObj(expId);

    if (btn_hdl.innerText == 'run') {
        let success = runExperiment(expId, graphsObj);
        if (success) {
            btn_hdl.innerText = 'stop';
            // Expand the simulation list for the first experiment (assumes <details> is the firstElementChild)
            if (nextExpId == 1) {
                let branch_hdl = document.getElementById(getBranchId(expId));
                branch_hdl.firstElementChild.open = true;
            }
        }
        else alert("Error: Could not start simulations");
    } else {
        stopExperiment(expId);
        btn_hdl.disabled = true;
    }
}


// Runs when an experiment's run button is clicked
function runExperiment(expId, graphsObj = null) {
    try {
        // set up the web workers for the current experiment
        setupWebWorkers(expId, graphsObj);

        // Get the experiment object that has 'expId' = expId
        let expObj = getExpObj(expId);

        // Set dataseries on the appropriate charts
        if (graphsObj != null) addSeriesToEachChart(graphsObj, expObj);

        // set the simulation running on each web worker
        let wws = expObj['wws'];
        for (let wwId = 0; wwId < wws.length; wwId++) {
            wws[wwId].postMessage({
                'params': expObj['params'],
                'kT_J': expObj['kT_Js'][wwId]
            });
        }
    }
    catch (error) { return false; }
    return true;
}


// Stops all web workers (simulations) in a particular experiment
function stopExperiment(expId) {
    // Find the experiment object with 'expId' = expId
    let expObj = getExpObj(expId);
    for (let i = 0; i < expObj['wws'].length; i++) {
        let ww = expObj['wws'][i];
        ww.terminate();
    }
}


// Set up the webworkers for a particular experiment
function setupWebWorkers(expId, graphsObj = null) {
    // Find the experiment object with 'expId' = expId
    let expObj = getExpObj(expId);

    // Create a new web worker for each reduced temperature in the experiment
    for (let i = 0; i < expObj['kT_Js'].length; i++) {
        expObj['wws'][i] = new Worker("./js/Ising2D.js");
        expObj['progress']['done'][i] = false;
    }

    // Set up the onmessage event of each web worker
    for (let wwId = 0; wwId < expObj['wws'].length; wwId++) {
        setupWWOnmessage(expObj, wwId, graphsObj);
    }

    // set up the view link for each web worker.
    // setupAnimLink(...) is contained in outputFields.js
    for (let wwId = 0; wwId < expObj['wws'].length; wwId++) {
        let viewLink = document.getElementById(getViewLinkId(expId, wwId));
        viewLink.addEventListener('click', () => { setupAnimLink(expObj, wwId, './html/simGrid.html'); });
    }
}


// Sets up the onmessage event for a particular web worker. 
// I.e. Details actions performed on the main thread when it received data from the web worker.
function setupWWOnmessage(expObj, wwId, graphsObj = null) {
    let expId = expObj['expId'];
    let ww = expObj['wws'][wwId];
    let expParams = expObj['params'];
    let nwws = expObj['wws'].length;
    let neq = expObj['params']['neq'];
    let nst = expObj['params']['nst'];

    ww.onmessage = (event) => {

        // data received from the web worker (particular ising simulation)
        let data = event.data;
        let mcs = data['mcs'];

        // Save the number of Monte Carlo steps completed
        expObj['progress']['mcs'][wwId] = mcs;

        // Get a handle to current ww's progress bar and update
        let progbar_hdl = document.getElementById(progBarId(expId, wwId));
        let eq = 1;
        let bgCol = "#fc8c03";
        let fld = 'neq';
        if (mcs > 0) { eq = 0; bgCol = "#4CAF50"; fld = 'nst'; }
        let percent = parseInt(100 * (eq + mcs / expParams[fld]));
        progbar_hdl.setAttribute("style", "background-color: " + bgCol);
        progbar_hdl.style.width = percent + '%';
        progbar_hdl.innerHTML = percent + '%';

        // Get a handle to current experiment's total progress bar
        let progbarTot_hdl = document.getElementById(progBarId(expId));
        let mcsDone = 0;
        for (let i = 0; i < nwws; i++) {
            mcsDone += expObj['progress']['mcs'][i];
        }
        let percentTot = parseInt(100 * (neq + mcsDone / nwws) / (neq + nst));
        progbarTot_hdl.style.width = percentTot + '%';
        progbarTot_hdl.innerHTML = percentTot + '%';

        // Things to do in the statistics phase
        if (mcs > 0) {
            if ('results' in data) {
                expObj['results'][wwId] = data['results'];
                for (let i = 0; i < rsltNames.length; i++) {
                    // update the output data grid for each quantity
                    document.getElementById(QtyGridId(rsltNames[i], expId, wwId)).innerText = parseFloat(expObj['results'][wwId][rsltNames[i]]).toFixed(4);
                    // update the chart data for the current worker
                    expObj['chartData'][rsltNames[i]][wwId].y = expObj['results'][wwId][rsltNames[i]];
                }
                // update the charts
                if (graphsObj != null) updateCharts(graphsObj);
            }
        }

        // Things to do in equilibration or statistics phase
        if ('lattice' in data) {
            // save the lattice state of the current worker (so it can be visualised)
            expObj['lattices'][wwId] = data['lattice'];

            // update lattice display if a valid view window is defined and open
            if (expObj['winHdls'][wwId] != null) {
                let win = expObj['winHdls'][wwId];
                if (!win.closed) {
                    if (win.document.readyState === 'complete') {
                        let Nx = expObj['params']['Nx'];
                        let Ny = expObj['params']['Ny'];
                        try {
                            win.window.update_grid(expObj['lattices'][wwId], Nx * Ny, expId, wwId);
                        }
                        catch (err) {
                            console.log("Couldn't display lattice");
                        }
                    }
                }
            }
        }

        // Test to see if web worker is finished - terminate if so.
        // Test to see if all workers are finished - if so, disable stop/run button and set its text to 'done'.
        if (expObj['progress']['mcs'][wwId] == expObj['params']['nst']) {

            // Log the current worker as completed.
            expObj['progress']['done'][wwId] = true;

            // test to see if all workers are finished - update interface accordingly if so
            let ncomplete = 0;
            for (let i = 0; i < nwws; i++) ncomplete += expObj['progress']['done'][i];
            if (ncomplete == nwws) {
                let runBtnHdl = document.getElementById(getRunBtnId(expId));
                runBtnHdl.disabled = true;
                runBtnHdl.innerText = "Done";
            }

            // terminate current (completed) web worker
            expObj['wws'][wwId].terminate();
        }
    }
}


// Find the experiment object with 'expId' = expId. Throw an error if not found.
function getExpObj(expId) {
    let expObj = expArr.find((obj) => obj['expId'] == expId);
    if (!expObj) throw new Error("ERROR: Couldn't find obj with expId = " + expId);
    return expObj;
}


// Create text string for data download
function createDataString(qtyNames) {
    let str = "";
    for (let i = 0; i < expArr.length; i++) {

        // current experiment from experiments array
        let expObj = expArr[i];

        // number of simulations in current experiment
        let nwws = expObj['kT_Js'].length;

        // experiment id
        str += ("expId:\t" + expObj['expId'] + "\n");

        // input parameters
        for (let p in expObj['params']) {
            str += (p + ":\t" + expObj['params'][p] + "\n");
        }

        // titles for results
        str += "kT/J\t";
        for (let r = 0; r < qtyNames.length; r++) str += (qtyNames[r] + "\t");
        str += "Complete\t";
        str += "neq_done\t";
        str += "nst_done\t";
        str += "\n";

        // results
        for (let i = 0; i < nwws; i++) {
            str += (expObj['kT_Js'][i].toFixed(5) + "\t");
            for (let j = 0; j < qtyNames.length; j++) {
                let qtyName = qtyNames[j];
                if ((expObj['results'][i] == null) || !(qtyName in expObj['results'][i]) || (expObj['results'][i][qtyName] == null)) str += "-\t"
                else str += (expObj['results'][i][qtyName].toFixed(5) + "\t");
            }
            if (expObj['progress']['done'][i]) str += "true\t";
            else str += "false\t";

            // completed steps
            let mcs = expObj['progress']['mcs'][i];
            let neq_done = mcs + expObj['params']['neq'];
            if (neq_done > expObj['params']['neq']) neq_done = expObj['params']['neq'];
            str += (neq_done + "\t");
            if (mcs < 0) str += "0\t";
            else str += mcs;

            str += "\n";
        }
        str += "\n";
    }
    return str;
}


// make new URL object for download data
function makeTextFile(fileText) {
    let data = new Blob([fileText], { type: 'text/plain' });
    // free memory if neccessary
    if (dataObjURL !== null) window.URL.revokeObjectURL(dataObjURL);
    // new object URL
    dataObjURL = window.URL.createObjectURL(data);
    return dataObjURL;
}


// Removes all child elements of a node
function removeChildren(id) {
    let parentNode = document.getElementById(id);
    while (parentNode.lastElementChild) parentNode.removeChild(parentNode.lastElementChild);
}


// Click event listener for download data button
document.getElementById('dwnld').addEventListener('click', () => { downloadDataFile(rsltNames) }, false);


// Automatically downloads a file containing all current experiment data.
function downloadDataFile(qtyNames) {
    let link = document.createElement('a');
    link.innerText = 'download link';
    link.setAttribute('download', 'IsingData.txt');
    link.href = makeTextFile(createDataString(qtyNames));
    removeChildren('dwnldSpan');
    document.getElementById('dwnldSpan').appendChild(link);
    // Download file without having to click the generated link.
    // Wait for link to be added by getting a subsequent animation frame
    window.requestAnimationFrame(() => {
        let event = new MouseEvent('click');
        link.dispatchEvent(event);
        removeChildren('dwnldSpan');
    });
}