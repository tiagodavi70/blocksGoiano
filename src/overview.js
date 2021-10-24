
$(function() {

});

function describeNumDataset(data, dim) {

    
    d3.select("#overview_stats").select("#overview_" + dim).selectAll("*").remove();

    let g = d3.select("#overview_stats").append("div")
        .classed("container", true)
        .style("padding", "10px")
        .attr("id", "overview_" + dim)
        .style("margin", "10px")

    // g = d3.select("#overview_stats").select(id).append("div")
    //         .text(dim_name)
                
    g.append("div")
        .attr("id", "description_" + dim)
        .style("border", "1px #ddd solid")
        
    // describeNumericalDim(data, dim, "#description_" + dim);
    
    g.append("div")    
        .attr("id", "overview_vis" + dim);
    // generateSVG("#overview_vis" + dim, [0, 0, width / 2, height / 2],
    //         {width: width / 2, height: height / 2});
    // histogramVis(convertForHistogram(data, dim), 
    //         {"width": width/2, "height": height/2, "selector": "#overview_vis" + dim});


}

function describeCatDataset(data, dim_name) {
    
    let id = "#overview_" + dim_name;
    d3.select("#overview_stats").select(id).selectAll("*").remove();

    let parent = d3.select("#overview_stats").select(id).append("div")
        .text(dim_name)
    
    parent.append("div")
        .attr("id", "overview_vis_" + dim_name);

    generateSVG("#overview_vis_" + dim_name, [-width / 4, -height / 4, width / 2, height / 2],
                        {width: width / 2, height: height / 2});
    pieChart(convertForPieChart(data, dim_name), 
            {"width": width/2, "height": height/2, "selector": "#overview_vis_" + dim_name});
}