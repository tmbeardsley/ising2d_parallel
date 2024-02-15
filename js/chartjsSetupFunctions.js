// Interacts with chartjs to set up output graphs
'use strict';

// Returns an object to hold multiple graphs.
// Requires an initial array of quantity names
function emptyGraphsObj(qtyNames) {
    return {
        'qtyNames': qtyNames,
        'ytitles': {},
        'xtitles': {},
        'charts': {}
    };
}


// Creates charts and links them to the html canvas tags.
// Html tags must have ids: 'chartCanv' + qtyName
function createCharts(graphsObj) {

    // list of quantity names received from Ising simulation
    let qtyNames = graphsObj['qtyNames'];

    // set y-titles for graphs
    graphsObj['ytitles'][qtyNames[0]] = '<M>/N';
    graphsObj['ytitles'][qtyNames[1]] = 'UL';
    graphsObj['ytitles'][qtyNames[2]] = 'J*J*Cv/Nk';
    graphsObj['ytitles'][qtyNames[3]] = 'J*chi/N';
    graphsObj['ytitles'][qtyNames[4]] = 'H/NkT';

    // set x-titles for graphs
    for (let i = 0; i < graphsObj['qtyNames'].length; i++) {
        let qtyName = graphsObj['qtyNames'][i];
        graphsObj['xtitles'][qtyName] = 'kT/J';
    }

    // create chart objects for the supplied quantities
    for (let i = 0; i < graphsObj['qtyNames'].length; i++) {
        let qtyName = graphsObj['qtyNames'][i];
        let canvName = 'chartCanv' + qtyName;
        let xtitle = graphsObj['xtitles'][qtyName];
        let ytitle = graphsObj['ytitles'][qtyName];
        let chart = createChart(canvName, xtitle, ytitle);
        graphsObj['charts'][qtyName] = chart;
    }
}


// Creates and returns a chart object.
function createChart(canvId, xtitle, ytitle) {
    let config = createChartConfigObj(null, xtitle, ytitle, null, null);
    let canv_hdl = document.getElementById(canvId);     // looks up the canvas tag set in index.html
    let chart = new Chart(canv_hdl, config);
    return chart;
}


// Add new dataseries to the appropriate charts for an experiment
function addSeriesToEachChart(graphsObj, expObj) {
    let seriesName = 'L=(' + expObj['params']['Nx'] + ',' + expObj['params']['Ny'] + ')';
    let rgb = [];
    for (let i = 0; i < 3; i++) { rgb.push(Math.random() * 255); }      // pick a random colour for the experiment
    for (let i = 0; i < graphsObj['qtyNames'].length; i++) {
        let qtyName = graphsObj['qtyNames'][i];
        let chart = graphsObj['charts'][qtyName];
        const chartData = createSeriesObj(seriesName, expObj['chartData'][qtyName], 'rgb(' + rgb.join(',') + ')');
        chart.data.datasets.push(chartData);
        chart.update();
    }
}


// update the charts
function updateCharts(graphsObj) {
    for (let i = 0; i < graphsObj['qtyNames'].length; i++) {
        let qtyName = graphsObj['qtyNames'][i];
        let chart = graphsObj['charts'][qtyName];
        chart.update();
    }
}


// Returns a chart-compatible array (for plotting) with the same length as Tarr
function createChartArray(Tarr, defVal) {
    let arr = new Array();
    for (let i = 0; i < Tarr.length; i++) {
        arr.push({ x: Tarr[i], y: defVal });
    }
    return arr;
}


// Returns a chart series object
function createSeriesObj(seriesLabel, dataArray, bgColour) {
    return {
            label: seriesLabel,
            data: dataArray,
            backgroundColor: bgColour
    };
}

// Returns a chart configuration object
function createChartConfigObj(chartDataObj, xtext, ytext, ymin, ymax) {
    return {
        type: 'scatter',
        data: chartDataObj,
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xtext
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: ytext
                    },
                    min: ymin,
                    max: ymax
                }
            }
        }
    };
}