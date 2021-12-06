
function generateSVG(id, viewPoint, size={width:width, height:height}) {
    let svg = d3.select(id).append("svg")
        .attr("width", size.width)
        .attr("height", size.height)
        .attr("viewBox", viewPoint)
    svg.append("g")
        .attr("id", "ggroup")
        .attr("stroke", "white")
    svg.append("g")
        .attr("id", "labels")
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle");
    return svg;
}

$(function(){
    
    generateSVG("#piechart", [-width / 2, -height / 2, width, height]);
    generateSVG("#histogram", [0, 0, width, height]);
    generateSVG("#boxplot", [0, 0, width, height]);

    generateSVG("#scatterplot_main_vis", [0, 0, width, height]);
    generateSVG("#beeswarm_main_vis", [0, 0, width, height]);
    generateSVG("#beeswarm_together_main_vis", [0, 0, width, height]);

    generateSVG("#pieLoaded", [-width / 2, -height / 2, width, height], {width: width/2, height: height/2});
    generateSVG("#histogramLoaded", [0, 0, width/2, height/2], {width: width/2, height: height/2});
    
    generateSVG("#pieSynth", [-width / 2, -height / 2, width, height], {width: width/2, height: height/2});
    generateSVG("#histogramSynth", [0, 0, width/2, height/2], {width: width/2, height: height/2});

    generateSVG("#scatterplot_comparison", [0, 0, width*2, height*2],  {width: width*2, height: height*2});
    
});

function describeNumericalDim(a, dim, id) {
    let arr = a.map(d => d[dim]);
    if (arr[0] !== undefined) {
        d3.select(id)
            .html(`<div style="align-self: center;">
                <div style="font-weight: bold; font-size: 15px; color: firebrick;"> Mean: ${d3.mean(arr).toFixed(3)} </div>
                <div style="font-weight: bold; font-size: 15px; color: black;"> Median: ${d3.median(arr).toFixed(3)} </div>
                Standard Deviation: ${d3.deviation(arr).toFixed(3)} <br>
                Variance: ${d3.variance(arr).toFixed(3)} <br>
                Min-Max: [${d3.min(arr).toFixed(3)}, ${d3.max(arr).toFixed(3)}] <br>
            </div>`);
    }
    // d3.quantile(athletes, 0.05, d => d.height)
}

function getKeysByType(id, type) {
        
    let cols = datagenerator.columns.filter(d => d.type == type); // column.generator
    return cols.map((d,i) => d.name);
}

function pieChart(data, cfg={width: width, height: height}) {

    let pie = d3.pie()
        // .sort(d => d.key)
        .value(d => d.value);
        
    const radius = Math.min(cfg.width, cfg.height) / 2 * 0.8;
    let arcLabel = d3.arc().innerRadius(radius).outerRadius(radius);

    let arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(cfg.width, cfg.height) / 2 - 1)
    
    let color = d3.scaleOrdinal()
        .domain(data.map(d => d.key))
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length == 1 ? 2 : data.length).reverse())

    const arcs = pie(data);

    let svg = d3.select(cfg.selector).select("svg");

    svg.select("g").selectAll("path")
        .data(arcs)
        .join("path")
            .attr("fill", d => color(d.data.key))
            .attr("d", arc)
            .on("mouseover", function(e,d) {
                d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", "2")
            })
            .on("mouseout", function(e,d) {
                d3.select(this)
                    .attr("stroke", "none")
            })
        .append("title")
            .text(d => `${d.data.key}: ${d.data.value.toLocaleString()}`);
    
    svg.select("#labels").selectAll("*").remove();
    svg.select("#labels").selectAll("text")
        .data(arcs)
        .join("text")
            .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
            .call(text => text.append("tspan")
                .attr("y", "-0.4em")
                .attr("font-weight", "bold")
                .text(d => d.data.name))
            .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
                .attr("x", 0)
                .attr("y", "0.7em")
                .style("font-size", 15)
                .attr("fill-opacity", 0.7)
                .attr("fill", "currentColor")
                .attr("paint-order","stroke")
                // .attr("stroke","#FFFFFF")
                .attr("font-weight", "bold")
                .text(d => `${d.data.key}: ${d.data.value.toLocaleString()}`)
                .on("mouseover", function(e,d) {
                    d3.select(this).style("font-size", 25)
                })
                .on("mouseout", function(e,d) {
                    d3.select(this).style("font-size", 15)
                }));
}

function histogramVis(data, cfg={width: width, height: height}) {

    let margin = {top: 20, right: 20, bottom: 30, left: 40};
    let color = "steelblue";
    
    let x = d3.scaleLinear()
        .domain([data[0].x0, data[data.length - 1].x1])
        .range([margin.left, cfg.width - margin.right])

    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.length)]).nice()
        .range([cfg.height - margin.bottom, margin.top])

    let xAxis = g => g
        .attr("transform", `translate(0,${cfg.height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(cfg.width / 80 ).tickSizeOuter(0))
        .call(g => g.append("text")
            .attr("x", cfg.width - margin.right)
            .attr("y", -4)
            .attr("fill", "currentColor")
            .attr("paint-order","stroke")
            .attr("stroke","#FFFFFF")
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .text(data.x))

    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(cfg.height / 40))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 4)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(data.y))
    
    let svg = d3.select(cfg.selector).select("svg");

    svg.selectAll("rect")
        .data(data)
        .join("rect")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(data.length > 1 ? 0 : 10, x(d.x1) - x(d.x0) - 1))
            .attr("y", d => y(d.length))
            .attr("height", d => y(0) - y(d.length))
            .attr("fill", color);

    svg.selectAll(".line_avg").remove();
    svg.append("line")
        .classed("line_avg", true)
        .style("stroke", "firebrick")
        .style("stroke-width", 5)
        .style("opacity", .4)
        .attr("x1", x(data.mean))
        .attr("y1", y.range()[0])
        .attr("x2", x(data.mean))
        .attr("y2", y.range()[1]);

    svg.append("text")
        .classed("line_avg", true)
        .style("fill", "firebrick")
        .style("opacity", .85)
        .attr("x", x(data.mean))
        .attr("y", y.range()[1])
        .text("Mean")

    svg.selectAll(".axis-histogram").selectAll("*").remove();

    svg.append("g")
        .classed("axis-histogram", true)
        .call(xAxis);
    
    svg.append("g")
        .classed("axis-histogram", true)
        .call(yAxis);

}

function scatterplot(data, cfg, regression=false) {
    let margin = {top: 25, right: 20, bottom: 35, left: 40};
    
    let svg = d3.select(cfg.selector).select("svg");
    
    let colorIf = !regression ? "steelblue" :
        d3.scaleOrdinal()
            .domain([... new Set(data.map(d=>d.color))].sort())
            .range(["#383880", "#f39800"]);

    let color = !regression ? "steelblue" : (d => colorIf(d.color));

    let x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .range([margin.left, cfg.width - margin.right])

    let y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .range([cfg.height - margin.bottom, margin.top])

    // let xAxis = g => g
    //     .attr("transform", `translate(0,${cfg.height - margin.bottom})`)
    //     .call(d3.axisBottom(x).ticks(width / 80))
    //     .call(g => g.select(".domain").remove())
    //     .call(g => g.append("text")
    //         .attr("x", cfg.width)
    //         .attr("y", - 4) // margin.bottom 
    //         .attr("fill", "currentColor")
    //         .attr("text-anchor", "end")
    //         .attr("paint-order","stroke")
    //         .attr("stroke","#FFFFFF")
    //         .attr("font-weight", "bold")
    //         .text(data.x))

    // let yAxis = g => g
    //     .attr("transform", `translate(${margin.left},0)`)
    //     .call(d3.axisLeft(y))
    //     .call(g => g.select(".domain").remove())
    //     .call(g => g.append("text")
    //         .attr("x", -margin.left)
    //         .attr("y", 10)
    //         .attr("fill", "currentColor")
    //         .attr("text-anchor", "start")
    //         .attr("paint-order","stroke")
    //         .attr("stroke","#FFFFFF")
    //         .attr("font-weight", "bold")
    //         .text(data.y))

    // let grid = g => g
    //         .attr("stroke", "currentColor")
    //         .attr("stroke-opacity", 0.1)
    //         .call(g => g.append("g")
    //     .selectAll("line")
    //     .data(x.ticks())
    //     .join("line")
    //         .attr("x1", d => 0.5 + x(d))
    //         .attr("x2", d => 0.5 + x(d))
    //         .attr("y1", margin.top)
    //         .attr("y2", cfg.height - margin.bottom))
    //     .call(g => g.append("g")
    //     .selectAll("line")
    //     .data(y.ticks())
    //     .join("line")
    //         .attr("y1", d => 0.5 + y(d))
    //         .attr("y2", d => 0.5 + y(d))
    //         .attr("x1", margin.left)
    //         .attr("x2", cfg.width - margin.right));


    let k = cfg.height / cfg.width;
    let = xAxis = (g, x) => g
        .attr("transform", `translate(0,${cfg.height})`)
        .call(d3.axisTop(x).ticks(12))
        // .call(g => g.select(".domain").attr("display", "none"))

    let yAxis = (g, y) => g
        .call(d3.axisRight(y).ticks(12))
        // .call(g => g.select(".domain").attr("display", "none"))

    let grid = (g, x, y) => g
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
        .call(g => g
            .selectAll(".x")
            .data(x.ticks(12))
            .join(
                enter => enter.append("line").attr("class", "x").attr("y2",cfg.height),
                update => update,
                exit => exit.remove()
            )
            .attr("x1", d => 0.5 + x(d))
            .attr("x2", d => 0.5 + x(d)))
        .call(g => g
            .selectAll(".y")
            .data(y.ticks(12 * k))
            .join(
                enter => enter.append("line").attr("class", "y").attr("x2", cfg.width),
                update => update,
                exit => exit.remove()
            )
            .attr("y1", d => 0.5 + y(d))
            .attr("y2", d => 0.5 + y(d)));

    svg.selectAll(".axis-scatter").selectAll("*").remove();

    let gx = svg.append("g")
        .classed("axis-scatter", true)
        // .call(xAxis);
    
    let gy = svg.append("g")
        .classed("axis-scatter", true)
        // .call(yAxis);
    
    let gGrid = svg.append("g")
        .classed("axis-scatter", true)
        // .call(grid);
    
    // let gDot = svg.selectAll("circle")
    //     .data(data)
    //     .join("circle")
    //         .attr("stroke", color)
    //         .attr("stroke-width", .5)
    //         .attr("cx", d => x(d.x))
    //         .attr("cy", d => y(d.y))
    //         .attr("fill", color)
    //         .style("opacity", .5)
    //         .attr("r", 3);   
            
    const gDot = svg.append("g")
      .classed("axis-scatter", true)
      .attr("fill", "none")
      .style("opacity", .5)
      .attr("stroke-linecap", "round");

    gDot.selectAll("path")
        .data(data)
        .join("path")
        .attr("d", d => `M${x(d.x)},${y(d.y)}h0`)
        .attr("stroke", color);
    
    let lines = [];
    let showLine = d3.select("#line_visible").property("checked");
    
    svg.selectAll("path.regression").remove();
    if (regression && showLine) {
        // console.log(cfg.selector, d3.select(cfg.selector).selectAll(".regression").nodes());
        d3.select("#suavizacao_parent").selectAll(".regression").remove();
        let slider_area = d3.select("#suavizacao_parent")
            .append("div")
                .classed("regression", true)
                .style("flex-direction", "column")
                .style("margin-top", "40px")
                .style("margin-left", "25px")
        slider_area.append("div")
            .text("Smooth factor")
        let slider = slider_area
            .append("input")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", 1)
            .attr("step", 0.01)
            .attr("value", .25)
            .style("margin", "10px 5px 10px 0px")
            .on("input", function(e,d) {
                let suavizacao = +d3.select(this).node().value;
                d3.select("#label_suavizacao").text(suavizacao);

                let regressionGenerator = d3.regressionLoess()
                    .x(d => d.x)
                    .y(d => d.y)
                    .bandwidth(suavizacao);
                let lineGenerator = d3.line()
                    .x(d => x(d[0]))
                    .y(d => y(d[1]));
                svg.selectAll("path.regression").remove();
                
                let dataLoaded = data.filter(d => d["color"] == "loaded");
                let predictionLoaded = regressionGenerator(dataLoaded)
                let l1 = svg.append("path")
                    .attr("class", "regression")
                    .style("opacity", .5)
                    .datum(predictionLoaded)
                    .style("stroke", "black")
                    .style("stroke-width", "0.3%")
                    .attr("d", lineGenerator);
                let l2 = svg.append("path")
                    .attr("class", "regression")
                    .style("opacity", .5)
                    .datum(predictionLoaded)
                    .style("stroke", colorIf("loaded"))
                    .style("stroke-width", "0.2%")
                    .attr("d", lineGenerator);

                let dataSynth = data.filter(d => d["color"] == "synth");
                let predictionSynth = regressionGenerator(dataSynth);
                
                let l3 = svg.append("path")
                    .attr("class", "regression")
                    .style("opacity", .5)
                    .datum(predictionSynth)
                    .style("stroke", "black")
                    .style("stroke-width", "0.3%")
                    .attr("d", lineGenerator);
                let l4 = svg.append("path")
                    .attr("class", "regression")
                    .style("opacity", .5)
                    .datum(predictionSynth)
                    .style("stroke", colorIf("synth"))
                    .style("stroke-width", "0.2%")
                    .attr("d", lineGenerator);
                lines = [l1, l2, l3, l4];

                d3.select("#error-x").text("Error X-Axis: " +
                    mse(predictionLoaded.map(d=>d[0]), predictionSynth.map(d=>d[0]) ).toFixed(3));
                d3.select("#error-y").text("Error Y-Axis: " +
                    mse(predictionLoaded.map(d=>d[1]), predictionSynth.map(d=>d[1]) ).toFixed(3));
                
                let size = Math.min(dataLoaded.length, dataSynth.length)
                d3.select("#error-total").text("Total Error: " +
                    mse(dataLoaded.slice(0,size).map(d => Math.sqrt(d.x*d.x + d.y*d.y) ),
                        dataSynth.slice(0,size).map(d =>   Math.sqrt(d.x*d.x + d.y*d.y) )).toFixed(3));
                        
                // d3.select("#error-total").text("Total Error: " +
                //     mse(predictionLoaded.map(d => Math.sqrt(d[0]*d[0] + d[1]*d[1]) ),
                //         predictionSynth.map(d =>  Math.sqrt(d[0]*d[0] + d[1]*d[1]) )).toFixed(3));
            });
        slider_area.append("div").attr("id", "label_suavizacao").text("0.25");
        slider_area.append("div")
            .attr("id", "error-x")
            .style("flex-direction", "column")
            .style("margin-top", "30px");
        slider_area.append("div")
            .attr("id", "error-y")
            .style("flex-direction", "column")
            .style("margin-top", "10px");
        slider_area.append("div")
            .attr("id", "error-total")
            .style("flex-direction", "column")
            .style("margin-top", "10px");
        slider.node().dispatchEvent(new Event('input'));
    }
    const zoom = d3.zoom()
        .scaleExtent([0.5, 32])
        .on("zoom", zoomed);

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

    function zoomed({transform}) {
        const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
        const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);

        gDot.attr("transform", transform).style("stroke-width", 5 / transform.k);
        gx.call(xAxis, zx);
        gy.call(yAxis, zy);
        gGrid.call(grid, zx, zy);
        lines.forEach(gLine => gLine.attr("transform", transform)) //.style("stroke-width", "0.1%")) // transform.k / 100000
    }
    Object.assign(svg.node(), {
        reset() {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }
    });
}

function corrMatrix(data, cfg) {
    
}

function treemap(data, cfg) {

    let svg = d3.select(cfg.selector).select("svg");
    svg.select("#ggroup").remove();
    svg.select("#labels").remove();

    let treeLayout = d3.treemap()
        .size([cfg.width, cfg.height])
        .tile(d3.treemapSquarify)
        // .paddingOuter(2)
        // .paddingInner(2)
        .padding(5)

    treeLayout(data);

    let color = d3.scaleOrdinal(d3.schemeTableau10);

    let cells = svg.selectAll('g')
        .data(d3.group(data, d => d.height))
        .join('g')
            .selectAll("rect")
            .data(d => d[1])
            .join("rect")
                .attr('x', function(d) { return d.x0; })
                .attr('y', function(d) { return d.y0; })
                .attr('width', function(d) { return d.x1 - d.x0; })
                .attr('height', function(d) { return d.y1 - d.y0; })
                .attr("fill", function (d) { return color(d.data[0]); })
                .attr('opacity', '.78');

    let te = svg.selectAll('g')
        .data(d3.group(data, d => d.height))
        .join('g')
            .selectAll("text")
            .data(d => d[1])
            .join("text")
                .text(function (d) {
                    if (d.data[0] != null) return d.data[0] + " - " + d.value;
                })
                .attr('x', function (d, i) {
                    return d.x0 + (d.x1-d.x0)/2;
                })
                .attr('y', function (d) {
                    if (d.children)
                        return d.y0 + 25/2;
                    else 
                        return d.y0 + (d.y1-d.y0)/2;
                })
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('text-anchor','middle')
                .attr('fill', 'black');
}

function clearDG() {
    d3.select("#piechart").style("display", "none");
    d3.select("#histogram").style("display", "none");
    d3.select("#vis_info").style("display", "none");
    d3.select("#scatterplot_main_vis").style("display", "none");
    d3.select("#beeswarm_main_vis").style("display", "none");
    d3.select("#boxplot").style("display", "none");
}

