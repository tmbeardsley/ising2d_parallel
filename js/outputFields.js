// Sets up the output fields for each new experiment
'use strict';

// Additional fixed ids and titles for the data grid
let _fixedIds = ['kT_J', 'progress', 'viewLink'];
let _fixedTitles = ['kT/J', 'Progress', 'View'];


// Set up the animation link - opens a new window showing the Ising model as a grid.
// htmlFile is the address of the html file to open in a new window
function setupAnimLink(expObj, wwId, htmlFile) {

    // scale the size of the window to the size of the grid
    let Nx = expObj['params']['Nx'];                                // Number of grid cells in x, y dimensions
    let Ny = expObj['params']['Ny'];
    let wh_px = 6;                                                  // width and height of a grid cell
    let Lx = Nx * wh_px + 1;
    let Ly = Ny * wh_px + 1;
    let winParams = "width=" + Lx + "px,height=" + Ly + "px";       // popout window dimensions

    // open a new grid window if one is not already open
    if ((expObj['winHdls'][wwId] == null) || (expObj['winHdls'][wwId].closed)) {
        let win = window.open(htmlFile, "expId_" + expObj['expId'] + "wwId_" + wwId, winParams);
        expObj['winHdls'][wwId] = win;
        win.onload = function () {
            win.document.getElementById('myspan').innerText = "Exp: " + expObj['expId'] + ", kT/J: " + expObj["kT_Js"][wwId];
            win.document.body.appendChild(win.makeAnimGrid(Nx, Ny, expObj['expId'], wwId));
            let container = win.document.getElementById('AnimGrid_expId_' + expObj['expId'] + '_' + wwId);
            container.style.width = Lx + 'px';
            container.style.height = Ly + 'px';
            // Plot the lattice if one exists
            if (expObj['lattices'][wwId] != null) {
                win.window.update_grid(expObj['lattices'][wwId], Nx * Ny, expObj['expId'], wwId);
            }
        }
    } else {
        // focus on window if it's already open
        expObj['winHdls'][wwId].focus();
    }
}


// Sets up a collapsible entry for experiment i in the list tree.
// Appends the new entry to treeRoot
function setupExpOutput(treeRoot, expId, nsims, qtyNames, qtyTitles) {

    // New list item for the experiment
    let li_exp = document.createElement('li');
    li_exp.id = getBranchId(expId);
    li_exp.className = 'expLi';

    // New details element for collapsible experiment list item
    let details = document.createElement('details');
    details.open = false;

    // New summary element to contain experiment number, run button and total progress bar
    let summary = document.createElement('summary');
    summary.innerText = 'Experiment ' + expId + ' ';

    // Run button contained in summary element
    let btn = document.createElement('button');
    btn.id = getRunBtnId(expId);
    btn.innerText = 'run';
    btn.className = 'runExpBtn';
    summary.appendChild(btn);

    // Progress bar next to the run button in summary element
    summary.appendChild(createProgressBar(progBarId(expId), 'progOuterDiv', 'progInnerDiv'));

    // Append the <summary> element (experiment #, run button and progress bar) to <details>
    details.appendChild(summary);

    // Append a <div> to <details> that contains a gridview for the experiment data
    details.appendChild(makeOutputGrid(expId, nsims, qtyNames, qtyTitles));

    // Append the newly constructed list item and details to the treeRoot element
    treeRoot.appendChild(li_exp).appendChild(details);

    // Place view links for each of the experiment's workers in the data grid
    for (let wwId = 0; wwId < nsims; wwId++) {
        let v = document.getElementById(viewLinkGridId(expId, wwId));
        v.innerText = null;
        v.appendChild(createViewLink(expId, wwId));
    }

    // Place progress bar in data grid
    for (let wwId = 0; wwId < nsims; wwId++) {
        let v = document.getElementById(progBarGridId(expId, wwId));
        v.innerText = null;
        v.appendChild(createProgressBar(progBarId(expId, wwId), 'progOuterDiv', 'progInnerDiv'));
    }
}


// Set up the output grid for a new experiment
function makeOutputGrid(expId, nwws, qtyNames, qtyTitles) {
    let rows = nwws + 1;                // additional +1 for titles
    let cols = 3 + qtyNames.length;     // progress, kT/J and view link

    // Create arrays containing column ids and titles for all output quantities
    let colIds = _fixedIds.concat(qtyNames);
    let colTitles = _fixedTitles.concat(qtyTitles);

    // Create a new div element to contain a grid
    let container = document.createElement('div');
    container.id = 'branch_expId_' + expId;
    container.className = 'container';

    // Set variables defining the number of grid rows and columns
    container.style.setProperty('--grid-rows', rows);
    container.style.setProperty('--grid-cols', cols);

    // Add the top row of column titles to the grid
    for (let x = 0; x < cols; x++) {
        let cell = document.createElement('div');
        cell.id = 'title_' + colIds[x] + '_expId_' + expId;
        cell.innerHTML = colTitles[x];
        cell.className = "title-cell";
        container.appendChild(cell);
    }

    // Set up each data cell of the grid and add unique ids.
    // Special case of progress bar cell adds additional class.
    for (let wwId = 0; wwId < nwws; wwId++) {
        for (let x = 0; x < cols; x++) {
            let cell = document.createElement('div');
            cell.id = QtyGridId(colIds[x], expId, wwId);
            cell.className = "grid-item";
            // Add classname to control progress cell
            if (cell.id == progBarGridId(expId, wwId)) {
                cell.classList.add('grid-progress');
            }
            cell.innerText = '-';
            container.appendChild(cell);
        }
    }

    // Define the number of rows/columns in the grid
    container.style.setProperty('grid-template-rows', 'repeat(var(--grid-rows), max-content)');
    container.style.setProperty('grid-template-columns', 'repeat(var(--grid-cols), max-content)');

    return container;
};

// Return a unique id to a grid cell given the quantity name, experiment id and web worker id
function QtyGridId(qtyName, expId, wwId) {
    return 'data_' + qtyName + '_expId_' + expId + '_wwId_' + wwId;
}

// Return unique id of a reduced temperature cell
function kT_JGridId(expId, wwId) {
    return 'data_' + _fixedIds[0] + '_expId_' + expId + '_wwId_' + wwId;
}

// Return unique id of a progress bar cell
function progBarGridId(expId, wwId) {
    return 'data_' + _fixedIds[1] + '_expId_' + expId + '_wwId_' + wwId;
}

// Return unique id of a progress bar cell
function viewLinkGridId(expId, wwId) {
    return 'data_' + _fixedIds[2] + '_expId_' + expId + '_wwId_' + wwId;
}

// create view hyperlink placeholder (not yet linked)
function createViewLink(expId, wwId) {
    let viewLink = document.createElement('a');
    viewLink.id = getViewLinkId(expId, wwId);
    viewLink.className = 'viewLink';
    viewLink.innerText = 'view';
    return viewLink;
}

// returns the unique id of a viewlink cell
function getViewLinkId(expId, wwId) {
    return 'viewLink_' + expId + '_' + wwId;
}

// returns the id of the experiment's run button
function getRunBtnId(expId) {
    return 'runExpBtn_' + expId;
}

// returns the unique id of an experiment's branch in the list view
function getBranchId(expId) {
    return 'li_expList_expId_' + expId;
}

// returns the unique id of a progress bar
function progBarId(expId, wwId = null) {
    let id = 'progBar_' + expId;
    if (wwId != null) id += '_' + wwId
    return id;
}


// Returns nested divs that act as a progress bar.
// Styled with classes: progOuterDiv and progInnerDiv.
function createProgressBar(id, outerClass, innerClass) {
    let outerDiv = document.createElement('div');
    outerDiv.className = outerClass;
    let progBarDiv = document.createElement('div');
    progBarDiv.id = id;
    progBarDiv.className = innerClass;
    outerDiv.appendChild(progBarDiv);
    return outerDiv;
}


