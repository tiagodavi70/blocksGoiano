
let datagenerator = new DataGenerator();

let width = 300;
let height = 300;

$(function() {

    d3.select("#new_dimension").on("mousedown", function(e, d) {
        createNewDimension();
    });
    d3.select("#button_run").on("mousedown", function(e, d) {
        update();
    });
    
    
});

function generateData() {
    // let menu_options = configureMenuOfGens();
    // for ( let t of ["Sequence", "Random", "Function", "Accessory"] ) {
    //     let options = menu_options[t];
    //     for (let o of Object.keys(options.items)) {
    //         let generator = new DataGenerator.listOfGens[o];
    //         let params = generator.getGenParams();
    //         if (params.map( d => d.type).filter( d => d == "numarray").length > 0) {
    //             console.log(generator, params.map( d => d.type));
    //         }
    //     }
    // }

    // console.log(menu_options);
    return datagenerator.generateSample();
}

function update() {
    let keysCategorical = updateOptions("#pieSelection", "cat"); 
    let keysNumerical =  updateOptions("#histogramSelection", "num");

    let dg = new DataGenerator();
    dg.addColumn("dim1");
    let g = new RandomCategoricalQtt();
    g.array = ["aaa"];
    g.counterQtt = [0];
    // g.reset()
    dg.addGeneratorToIndex(0,g);

    console.log(datagenerator);
    console.log(dg);
    // console.log(dg.generateSample())
    // let data = generateData();
    // console.log("keys cat", keysCategorical);
    // console.log("keys num", keysNumerical);
    
    // if (keysCategorical.length > 0)
    //     pieChart(convertForPieChart(data, keysCategorical[0]));
    
    // if (keysNumerical.length > 0)
    //     histogram(convertForHistogram(data, keysNumerical[0]));
}

function load() {

}

function convertForPieChart(data, key) {
    let datapie = d3.rollup(data, v => v.length, d => d[key]);
    return Array.from(datapie).map( d => ({"key": d[0], "value": d[1]}));
}

function convertForHistogram(data, key) {
    let newData = d3.bin().thresholds(40)(data.map( d => d[key]));
    newData.x = key;
    newData.y = 'Count';
    return newData;
}