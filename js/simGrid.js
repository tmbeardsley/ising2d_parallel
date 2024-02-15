// Controls the css grid in simGrid.html
'use strict';

// Colours to use to signify spin up/down in the grid
const colour_arr = new Array("red", "blue");

// Returns a unique css grid given experiment and web worker ids
function makeAnimGrid(cols, rows, expId, wwId) {
    let gridDiv = document.createElement('div');
    gridDiv.id = 'AnimGrid_expId_' + expId + '_' + wwId;
    gridDiv.className = 'container';
    gridDiv.style.setProperty('--grid-rows', rows);
    gridDiv.style.setProperty('--grid-cols', cols);

    // Give each grid cell a unique id
    for (let c = 0; c < (rows * cols); c++) {
        let cell = document.createElement("div");
        cell.id = 'cell_' + expId + '_' + wwId + '_' + c;
        cell.style.backgroundColor = 'white';
        gridDiv.appendChild(cell).className = "grid-item";
    }
    return gridDiv;
}

// Update all cells in the grid given a new lattice state
function update_grid(lattice, N, expId, wwId) {
    for (let i = 0; i < N; i++) {
        update_cell(lattice, i, expId, wwId);
    }
}

// Updates the colour of a particular cell in the grid depending on its spin up/down state
function update_cell(lattice, cell, expId, wwId) {
    let s_div = document.getElementById('cell_' + expId + '_' + wwId + '_' + cell);
    s_div.style.backgroundColor = colour_arr[(1-lattice[cell])/2];
}
