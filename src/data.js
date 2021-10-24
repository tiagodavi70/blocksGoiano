
let datagenerator = new DataGenerator();

let width = 270;
let height = 270;

function getDoubleIndex(str) {
    return [str.split("_")[1], str.split("_")[2]];
}

// recover generators from datagenerator
function updateCategoricalColumn(col) {
    for (let cat of col.generator.inputArray) {
        let colGenName = col.generator.selectedInterface[cat];
        col.generator.listOfGenerators[cat] = getColFromName(colGenName).generator;
    }
    return col;
}

function isNull(col) {
    return Object.keys(col.generator.listOfGenerators)
            .filter(d => col.generator.listOfGenerators[d].name == "delete-me").length >= 1;
}

$(function() {

    d3.select("#new_dimension").on("mousedown", function(e, d) {
        createNewDimension();
    });
    d3.select("#button_run").on("mousedown", function(e, d) {
        update();
    });
});

function generateData() {
    let data =  datagenerator.generateSample();
    data.columns = datagenerator.columns.map(d => d.name); 
    return data;
}

function update() {

    let keysCategorical = getKeysByType("#pieSelection", "Categorical"); 
    let keysNumerical = getKeysByType("#overview_num", "Numeric");

    /* update conditions
            1 must have an input generator object
            2 categories must not be nullGenerators
        after that it updates the categorical function with the right generators
    */

    for (let i = 0 ; i < datagenerator.columns.length ; i++) {
        let col = datagenerator.columns[i];
        if (col.generator.name == "Categorical Function" && 
                Object.keys(col.generator).indexOf("inputGenerator") > 0) {
            if (col.generator.inputGenerator == undefined) {
                col.display = false;
            } else {
                let index = getIndex(col.name);
                let allAux = datagenerator.columns.filter(d => !d.display && getDoubleIndex(d.name)[0] == index);
                   
                col.display = allAux.filter(c => c.generator.name == "delete-me").length == 0;
                datagenerator.columns[i] = updateCategoricalColumn(col);
            }
            
        }
    }

    let dim_name = d3.select("#text_placeholder").text();
    let col = getColFromName(dim_name);
    let gen = col.generator;
    let geni = gen;
    for (let i = 0 ; i < nGen(gen) - 1 ; i++) {
        geni = geni.generator;
    }     
    let type = col.type;

    let data = generateData();
    
    clearDG();
    setViewCompare(data, keysCategorical,keysNumerical, "#pieSynth", "#histogramSynth");
    updateCompDropdowns(keysNumerical);

    if (data[0][dim_name] !== undefined) {

        let svg = BoxPlot(data, {
            x: d => d[dim_name],
            y: d => d[dim_name],
            width: 230,
            height: 150,
            thresholds: 1
        });
        d3.select("#boxplot").style("display", "inherit");
        d3.select("#boxplot").selectAll("*").remove();
        d3.select("#boxplot").node().appendChild(svg);


        let t_data = data.slice(-10);
        t_data.columns = data.columns;
        d3.select("#table_vis").selectAll("*").remove();
        let table = new Table("#table_vis", t_data, {size: "300px"})
        table.render();

        if (type == "Categorical") {
            
            if (!(geni["array"].length == 3 && geni["array"].filter(
                (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3)) {
                    d3.select("#piechart").style("display", "inherit");    
                    
                    pieChart(convertForPieChart(data, dim_name), 
                        {"width": width, "height": height, "selector": "#piechart"});

                    describeCatDataset(data, dim_name);
                }
        } else if (type == "Numeric") {
            d3.select("#histogram").style("display", "inherit");
            d3.select("#vis_info").style("display", "inherit");

            histogramVis(convertForHistogram(data, dim_name), 
                {"width": width, "height": height, "selector": "#histogram"});
           describeNumericalDim(data, dim_name, "#vis_info");
           console.log(gen)
           describeNumDataset(data, dim_name)
        }
         
        if (col.generator.inputGenerator) {
            if (col.generator.name == "Categorical Function") {
                let svg = BeeswarmChart(data, {
                    x: d => d[col.name],
                    width: width,
                    colorMap: d => d[col.generator.inputGenerator.parent.name]
                });
                d3.select("#beeswarm_together_main_vis").style("display", "inherit");
                d3.select("#beeswarm_together_main_vis").selectAll("*").remove();
                d3.select("#beeswarm_together_main_vis").node().appendChild(svg);

                d3.select("#beeswarm_main_vis").style("display", "inherit");
                Beeswarm(convertForBeeswarm(data,
                    {x: "dimension_0", y: "dimension_1"}), {selector: "#beeswarm_main_vis", width: width, height: height});
            } else {
                d3.select("#scatterplot_main_vis").style("display", "inherit");
                scatterplot(convertForScatterplot(data, {
                        "x": col.generator.inputGenerator.parent.name, 
                        "y": dim_name
                    }), {
                        "width": width,
                        "height": height,
                        "selector": "#scatterplot_main_vis"
                });
            }
        }
    }
}

function convertForPieChart(data, key) {
    let datapie = d3.rollup(data, 
                            v => v.length,
                            d => d[key]);
    return Array.from(datapie).map( d => ({"key": d[0], "value": d[1]}));
}

function convertForHistogram(data, key) {
    let newData = d3.bin().thresholds(40)(data.map( d => d[key]));
    newData.x = key;
    newData.y = 'Count';
    return newData;
}

function convertForScatterplot(data, keys) {
    let newData = data.map(d => ({  "x": d[keys.x], 
                                    "y": d[keys.y], 
                                    "color": d[keys.color] }));
    newData.x = keys.x;
    newData.y = keys.y;
    newData.color = keys.color;
    return newData;
}

function convertForBeeswarm(data, keys) {
    let newData = data.map(d => ({  "Rx": d[keys.x], 
                                    "Ry": d[keys.y], 
                                    "color": d[keys.x] }));
    newData.x = keys.x;
    newData.y = keys.y;
    return newData;
}