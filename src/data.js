
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

function downloadCSV(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

$(function() {

    d3.select("#new_dimension").on("mousedown", function(e, d) {
        createNewDimension();
    });
    d3.select("#button_run").on("mousedown", function(e, d) {
        update();
    });

    d3.select("#button_download").on("mousedown", function(e, d) {
        let data = generateData();
        let csvData = d3.csvFormat(data)
        console.log(csvData);

        downloadCSV("dataset.csv", csvData);
    });

    d3.select("#line_visible").on("change", function(e,d) {
        // console.log("line showing now")
        loadScatterplot();
    })
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

    if (datagenerator.columns.length == 0 ) {
        return;
    }

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

    if (data[0][dim_name] !== undefined) {

        let t_data = data.slice(-10);
        t_data.columns = data.columns;
        updateTable(t_data)

        setViewCompare(data, keysCategorical,keysNumerical, "#pieSynth", "#histogramSynth");
        updateCompDropdowns(keysNumerical);
        updateDropdownsVis(keysCategorical, keysNumerical, data);
        
        if (type == "Categorical") {
            
            if (!(geni["array"].length == 3 && geni["array"].filter(
                (d, i) => d == ['Banana', 'Apple', 'Orange'][i]).length == 3) || 
                (generator["weights"].length != generator["array"].length)) {
                    d3.select("#piechart").style("display", "inherit");    
                    
                    let pie_data = convertForPieChart(data, dim_name);
                    pieChart(pie_data, {"width": width, "height": height, "selector": "#piechart"});

                    describeCatDataset(data, dim_name);
                }
        } else if (type == "Numeric" || type == "Mixed") {
            d3.select("#histogram").style("display", "inherit");
            d3.select("#vis_info").style("display", "inherit");

            histogramVis(convertForHistogram(data, dim_name), 
                {"width": width, "height": height, "selector": "#histogram"});
            let svg = BoxPlot(data, {
                x: d => d[dim_name],
                y: d => d[dim_name],
                width: 230,
                height: 270,
                thresholds: 1
            });
            d3.select("#boxplot").style("display", "inherit");
            d3.select("#boxplot").selectAll("*").remove();
            d3.select("#boxplot").node().appendChild(svg);
            
            describeNumericalDim(data, dim_name, "#vis_info");
            describeNumDataset(data, dim_name)
        }

        function getIfFunction(gen) {
            if (gen.inputGenerator) {
                return gen;
            } else {
                return gen.generator ? getIfFunction(gen.generator) : gen;
            }
        }
        
        let generatorFunction = getIfFunction(col.generator);

        if (generatorFunction.inputGenerator) {
            if (generatorFunction.name == "Categorical Function") {
                let svg = BeeswarmChart(data, {
                    x: d => d[col.name],
                    width: width,
                    colorMap: d => d[generatorFunction.inputGenerator.parent.name]
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
                        "x": generatorFunction.inputGenerator.parent.name, 
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
    let unique = [...new Set(data.map(d => d[key]))];
    console.log("unique", unique, unique.map( u=> ({"key":u, "value": data.filter(d=>d[key] == u).length}) ))

    let datapie = d3.group(data, 
                            function(d) { console.log(d[key]) ; return d[key] });
                            
    return Array.from(datapie).map( d => ({"key": d[0], "value": d[1].length}));
}

function convertForHistogram(data, key) {
    let newData = d3.bin().thresholds(40)(data.map( d => d[key]));
    newData.x = key;
    newData.y = 'Count';
    newData.mean = d3.mean(data, d => d[key])
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

function convertForTreemap(data, l1, l2) {
    
    let rollupData = d3.rollup(data, v => v.length, d => d[l1], d => d[l2]);
    let childrenAccessorFn = ([ key, value ]) => value.size && Array.from(value);

    return d3.hierarchy([null, rollupData], childrenAccessorFn)
        .sum(([key,value]) => value)
        .sort((a, b) => b.value - a.value)
}

