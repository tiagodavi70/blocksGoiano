
let datagenerator = new DataGenerator();

let width = 270;
let height = 270;

$(function() {

    d3.select("#new_dimension").on("mousedown", function(e, d) {
        createNewDimension();
    });
    d3.select("#button_run").on("mousedown", function(e, d) {
        update();
    });
    
    loadData();
});

function generateData() {
    let data =  datagenerator.generateSample();
    data.columns = datagenerator.columns.map(d => d.name); 
    return data;
}

function update() {

    // let keysCategorical = updateOptions("#pieSelection", "cat"); 
    let keysNumerical = updateOptions("#overview_num", "Numeric");
    let colsToNotUpdate = datagenerator.columns.filter(d => d.generator.inputGenerator);

    // console.log(colsToNotUpdate);

    let dim_name = d3.select("#text_placeholder").text();
    let col = datagenerator.columns[datagenerator.columns.map(d => d.name).indexOf(dim_name)];
    let gen = col.generator;
    let geni = gen;
    for (let i = 0 ; i < nGen(gen) - 1 ; i++) {
        geni = geni.generator;
    }     
    let type = col.type;

    let data = generateData();
    
    clearDG();
    if (data[0][dim_name] !== undefined) {
        describeNumDataset(data, keysNumerical);

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

                    d3.select("#overview_viz").append("div")
                        .text(dim_name)
                    .append("div")
                        .attr("id", "overview_" + dim_name);

                    generateSVG("#overview_" + dim_name, [-width / 4, -height / 4, width / 2, height / 2],
                                        {width: width / 2, height: height / 2});
                    pieChart(convertForPieChart(data, dim_name), 
                            {"width": width/2, "height": height/2, "selector": "#overview_" + dim_name});
                }
        } else if (type == "Numeric") {
            d3.select("#histogram").style("display", "inherit");
            d3.select("#vis_info").style("display", "inherit");

            histogramVis(convertForHistogram(data, dim_name), 
                {"width": width, "height": height, "selector": "#histogram"});

            describeNumericalDim(data, dim_name, "#vis_info");

            d3.select("#overview_viz").append("div")
                .text(dim_name)
            .append("div")    
                .attr("id", "overview_" + dim_name);
                        
            generateSVG("#overview_" + dim_name, [0, 0, width / 2, height / 2],
                    {width: width / 2, height: height / 2});
            histogramVis(convertForHistogram(data, dim_name), 
                    {"width": width/2, "height": height/2, "selector": "#overview_" + dim_name});
        }
         
        if (col.generator.inputGenerator) {
            d3.select("#scatterplot_main_vis").style("display", "inherit");
            scatterplot(convertForScatterplot(data, {
                    "x": col.generator.inputGenerator.parent.name, 
                    "y": dim_name,
                    "color": "steelblue"
                }), 
                    {"width": width,
                    "height": height,
                    "selector": "#scatterplot_main_vis"
                });
        }
    }
}

function loadData() {
    
    let datasets = ["iris.csv", "automobile.csv"];
    let types = {"iris.csv": {"sepal_length": "num", "sepal_width": "num",
                 "petal_length": "num", "petal_width": "num","iris":"cat"}
                };

    function updateComparison(dataPath) {

        d3.csv("data/" + dataPath, d3.autoType).then(function(data) {
            let cat_keys = Object.keys(types[dataPath]).filter( key => types[dataPath][key] == "cat");
            let num_keys = Object.keys(types[dataPath]).filter( key => types[dataPath][key] == "num");

            pieChart(convertForPieChart(data, cat_keys[0]), {"width": width, "height": height, "selector": "#pieLoaded"});
            histogramVis(convertForHistogram(data, num_keys[0]), {"width": width, "height": height, "selector": "#histogramLoaded"});
        })
    }

    d3.select("#datasets").append("select")
            .on("change", function(e, d) {
                let path = d3.select(this).node().value;
                updateComparison(path)
            })
        .selectAll("option")
        .data(datasets)
        .join("option")
            .text(d => d)
            .attr("value", d => d);

    updateComparison(datasets[0])
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
    return data.map(d => ({ "x": d[keys.x], 
                            "y": d[keys.y], 
                            "color": keys.color }));
}