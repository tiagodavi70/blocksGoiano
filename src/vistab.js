$(function(){
    
    let parent_scatterplot = d3.select("#scatterplot_vis")
        .append("div")
            .attr("id", "dropdown_scatter_y")
            .classed("container", true)
    
    parent_scatterplot.append("select")
            .style("align-self", "center");

    let p2 = parent_scatterplot
        .append("div")
        .attr("id", "scatterplot_vistab");

    generateSVG("#scatterplot_vistab", [0, 0, width, height],  {width: width, height: height});
    p2.append("div")
        .attr("id", "dropdown_scatter_x")
        .style("margin-left", "200px")
        .append("select")

    let parent_treemap = d3.select("#treemap_vis").append("div")
        .classed("container", true);

    let drops = parent_treemap.append("div");
    drops.append("div")
        .text("Level 1")
        .attr("id", "dropdown_treemap_1")
        .style("margin", "5px")
    .append("select")
        .style("margin", "5px");
    
    drops.append("div")
        .text("Level 2")
        .attr("id", "dropdown_treemap_2")
        .style("margin", "5px")
    .append("select")
        .style("margin", "5px");
    
    parent_treemap.append("div").attr("id", "treemap_vistab")
    generateSVG("#treemap_vistab", [0, 0, width, height],  {width: width, height: height});

});

function updateDropdownsVis(cat_keys, num_keys, data) {
    updateDropdown("#dropdown_scatter_x", num_keys, () => updateVisTab(data));
    updateDropdown("#dropdown_scatter_y", num_keys, () => updateVisTab(data));

    updateDropdown("#dropdown_treemap_1", cat_keys, () => updateVisTab(data));
    updateDropdown("#dropdown_treemap_2", cat_keys, () => updateVisTab(data));

    updateVisTab(data);
}

function updateVisTab(data) {
    let sp_x = d3.select("#dropdown_scatter_x select").node().value;
    let sp_y = d3.select("#dropdown_scatter_y select").node().value;

    let tm_1 = d3.select("#dropdown_treemap_1 select").node().value;
    let tm_2 = d3.select("#dropdown_treemap_2 select").node().value;

    if (sp_x != "" || sp_x != "" && (sp_x != sp_x )){
        scatterplotVis(data, sp_x, sp_y);
    }

    if ((tm_1 != "" && tm_2 != "") && (tm_1 != tm_2)){
        treemap(convertForTreemap(data, tm_1, tm_2), {
            "width": width,
            "height": height,
            "selector": "#treemap_vistab"
        })
    }

}

function updateTable(t_data) {
    d3.select("#table_vis").selectAll("*").remove();
    let table = new Table("#table_vis", t_data, {size: "300px"})
    table.render();
}

function scatterplotVis(data, colX, colY) {
    
    scatterplot(convertForScatterplot(data, {
        "x": colX, 
        "y": colY
    }), {
        "width": width,
        "height": height,
        "selector": "#scatterplot_vistab"
    });
}
