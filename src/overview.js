
$(function() {

});

function describeNumDataset(data, keys) {

    d3.select("#overview_stats").selectAll("*").remove()
    for (let dim of keys) {
        d3.select("#overview_stats").append("div")
            .style("padding", "10px")
            .style("max-width", "250px")
            .text(dim)
        .append("div")
            .attr("id", "num_dataset_" + dim)
            .style("border", "1px #ddd solid")
        describeNumericalDim(data, dim, "#num_dataset_" + dim);
    }        
}