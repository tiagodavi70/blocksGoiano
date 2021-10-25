
$(function() {

    d3.select("#settings").select("input").on("input", function(e,d) {
        let v = +d3.select(this).node().value;
        d3.select("#label_datapoints").text(v);

        datagenerator.n_lines = v;
        datagenerator.n_sample_lines = v;
        update();
    });
});

function describeNumDataset(data, dim) {

    let id = "#overview_" + dim;
    d3.select("#overview_stats").select(id).selectAll("*").remove();

    let parent = d3.select("#overview_stats").select(id).append("div")
        .text(dim)
        .style("margin", "15px");
    
    parent = parent.append("div")
    parent.classed("container", true)
        .style("padding", "10px")
        .style("margin", "10px")

    // let g = d3.select("#overview_stats").append("div")
    //     .classed("container", true)
    //     .style("padding", "10px")
    //     .attr("id", "overview_" + dim)
    //     .style("margin", "10px")

    // parent.append("div")
    //         .text(dim)
                
    parent.append("div")
        .attr("id", "description_" + dim)
        .style("border", "1px #ddd solid")
        
    describeNumericalDim(data, dim, "#description_" + dim);
    
    parent.append("div")    
        .attr("id", "overview_vis_" + dim);
    generateSVG("#overview_vis_" + dim, [0, 0, width / 2, height / 2],
            {width: width / 2, height: height / 2});
    histogramVis(convertForHistogram(data, dim), 
            {"width": width/2, "height": height/2, "selector": "#overview_vis_" + dim});


}

function describeCatDataset(data, dim_name) {
    
    let id = "#overview_" + dim_name;
    d3.select("#overview_stats").select(id).selectAll("*").remove();

    let parent = d3.select("#overview_stats").select(id).append("div")
        .text(dim_name)
        .style("margin", "15px");
    
    parent.append("div")
        .attr("id", "overview_vis_" + dim_name);

    generateSVG("#overview_vis_" + dim_name, [-width / 4, -height / 4, width / 2, height / 2],
                        {width: width / 2, height: height / 2});
    pieChart(convertForPieChart(data, dim_name), 
            {"width": width/2, "height": height/2, "selector": "#overview_vis_" + dim_name});
}