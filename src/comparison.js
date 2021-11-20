let loadedData;
let datasets = ["geocapes_sul.csv", "iris.csv", "automobile.csv"];
let datasetTypes = {"iris.csv": {"sepal_length": "num", "sepal_width": "num",
                                "petal_length": "num", "petal_width": "num","iris":"cat"},
                    "geocapes_sul.csv": {"ANO":"num", "UF":"cat", "DOUTORADO_PLENO": "num", "MESTRADO":"num"}
            };


$(function() {
    
    loadData();
});

function loadData() {
    
    function updateSingleVisComparison(dataPath) {

        d3.csv("data/" + dataPath, d3.autoType).then(function(data) {
            loadedData = data;
            let cat_keys_load = Object.keys(datasetTypes[dataPath]).filter( key => datasetTypes[dataPath][key] == "cat");
            let num_keys_load = Object.keys(datasetTypes[dataPath]).filter( key => datasetTypes[dataPath][key] == "num");
            setViewCompare(data, cat_keys_load, num_keys_load, "#pieLoaded", "#histogramLoaded");
            updateCompDropdowns([]);
        });
    }

    d3.select("#datasets").append("select")
            .attr("id", "dataset_selection")
            .on("change", function(e, d) {
                let path = d3.select(this).node().value;
                updateSingleVisComparison(path);
            })
        .selectAll("option")
        .data(datasets)
        .join("option")
            .text(d => d)
            .attr("value", d => d);

    updateSingleVisComparison(datasets[0]);
}


function loadScatterplot(node) {

    let dimLoaded = ["#dropdown_x_origin","#dropdown_y_origin"].map( node => d3.select(node).select("select").node().value);
    let dimSynth = ["#dropdown_x_synth","#dropdown_y_synth"].map( node => d3.select(node).select("select").node().value);

    if (dimSynth.indexOf('') >= 0) return;

    let synthData = generateData();
    
    let M = loadedData.map(d => (       {x: d[dimLoaded[0]], y: d[dimLoaded[1]], source: "loaded"}))
            .concat(synthData.map(d => ({x: d[dimSynth[0]],  y: d[dimSynth[1]] , source: "synth"})) );
    
    scatterplot(convertForScatterplot(M, {
        "x": "x", 
        "y": "y",
        "color": "source"
    }), {
        "width": width * 2,
        "height": height * 2,
        "selector": "#scatterplot_comparison"
    }, regression=true);
}

function updateCompDropdowns(keys_num_synth) {
    let dataPath = d3.select("#dataset_selection").node().value;
    let num_keys_load = Object.keys(datasetTypes[dataPath]).filter( key => datasetTypes[dataPath][key] == "num");

    updateDropdown("#dropdown_x_origin", num_keys_load, loadScatterplot);
    updateDropdown("#dropdown_y_origin", num_keys_load, loadScatterplot);

    if (keys_num_synth.length > 0) {
        updateDropdown("#dropdown_x_synth", keys_num_synth, loadScatterplot);
        updateDropdown("#dropdown_y_synth", keys_num_synth, loadScatterplot);     
    }
}

function setViewCompare(data, cat_keys, num_keys, pieId, histId) {

    if (cat_keys.length > 0 && data[0][cat_keys[0]] !== undefined) {
        pieChart(convertForPieChart(data, cat_keys[0]), {"width": width / 2, "height": height / 2, "selector": pieId});
        updateDropdown(pieId, cat_keys, function(node) {
            let v = d3.select(node).node().value;
            pieChart(convertForPieChart(data, v), {"width": width / 2, "height": height / 2, "selector": pieId});
        });
    }
    if (num_keys.length > 0 && data[0][num_keys[0]] !== undefined) {
        histogramVis(convertForHistogram(data, num_keys[0]), {"width": width / 2, "height": height / 2, "selector": histId});
        updateDropdown(histId, num_keys, function(node) {
            let v = d3.select(node).node().value;
            histogramVis(convertForHistogram(data, v), {"width": width / 2, "height": height / 2, "selector": histId});
        });
    }
}

function updateDropdown(selector, keys, callback=function(){}) {
    d3.select(selector).select("select")
        .on("change", function(e,d) {
            callback(this);
        }).selectAll("option")
        .data(keys)
        .join("option")
            .text(d => d)
            .attr("value", d => d)
}


function mse(a, b) {
	let error = 0
	for (let i = 0; i < a.length; i++) {
		error += Math.pow((b[i] - a[i]), 2)
	}
	return error / a.length
}
