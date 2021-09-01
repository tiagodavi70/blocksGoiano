
d3.select("#button_run").on("mousedown", () => {
    
    let datagenerator = new DataGenerator();
    datagenerator.addColumn("dimension_1")

    dimensions[0].forEach((generator => 
        datagenerator.addGeneratorToIndex(0, generator) )
    )

    console.log(datagenerator);
    console.log(datagenerator.generateSample());
    
});