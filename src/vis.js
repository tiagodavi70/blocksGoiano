
function generateSVG(id, viewPoint, size={width:width, height:height}) {
    let svg = d3.select(id).append("svg")
        .attr("width", size.width)
        .attr("height", size.height)
        .attr("viewBox", viewPoint)
    svg.append("g")
        .attr("stroke", "white")
    svg.append("g")
        .attr("id", "labels")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "middle");
    return svg;
}

$(function(){
    
    generateSVG("#piechart", [-width / 2, -height / 2, width, height]);
    generateSVG("#histogram", [0, 0, width, height]);

    generateSVG("#pieLoaded", [-width / 2, -height / 2, width, height]);
    generateSVG("#histogramLoaded", [0, 0, width, height]);
    generateSVG("#scatterplot_main_vis", [0, 0, width, height]);
});

function describeNumericalDim(a, dim, id) {
    let arr = a.map(d => d[dim]);
    if (arr[0] !== undefined) {
        d3.select(id)
            .html(`<div>
                Mean: ${d3.mean(arr).toFixed(3)} <br>
                Median: ${d3.median(arr).toFixed(3)} <br>
                Standard Deviation: ${d3.deviation(arr).toFixed(3)} <br>
                Variance: ${d3.variance(arr).toFixed(3)} <br>
                Min-Max: [${d3.min(arr).toFixed(3)}, ${d3.max(arr).toFixed(3)}] <br>
            </div>`);
    }
    // d3.quantile(athletes, 0.05, d => d.height)
}

function updateOptions(id, type) {
    let f = d => d.type == type;
    
    let cols = datagenerator.columns.filter(f); // column.generator
    let names = cols.map((d,i) => d.name);
    
    d3.select(id).selectAll("option")
        .data(names)
        .join("option")
            .attr("value", d => d)
            .text(d => d);
    return names;
}

function pieChart(data, cfg={width: width, height: height}) {

    let pie = d3.pie()
        .sort(null)
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
                .attr("fill-opacity", 0.7)
                .text(d => `${d.data.key}: ${d.data.value.toLocaleString()}`));
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

    svg.selectAll(".axis-histogram").selectAll("*").remove();

    svg.append("g")
        .classed("axis-histogram", true)
        .call(xAxis);
    
    svg.append("g")
        .classed("axis-histogram", true)
        .call(yAxis);
}

function scatterplot(data, cfg) {
    let margin = {top: 25, right: 20, bottom: 35, left: 40};
    
    let svg = d3.select(cfg.selector).select("svg");

    let x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x)).nice()
        .range([margin.left, width - margin.right])

    let y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y)).nice()
        .range([cfg.height - margin.bottom, margin.top])

    let xAxis = g => g
        .attr("transform", `translate(0,${cfg.height - margin.bottom})`)
        // .call(g => g.select("*").remove())
        .call(d3.axisBottom(x).ticks(width / 80))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", cfg.width)
            .attr("y", margin.bottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(data.x))

    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(data.y))

    let grid = g => g
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
            .call(g => g.append("g")
        .selectAll("line")
        .data(x.ticks())
        .join("line")
            .attr("x1", d => 0.5 + x(d))
            .attr("x2", d => 0.5 + x(d))
            .attr("y1", margin.top)
            .attr("y2", cfg.height - margin.bottom))
        .call(g => g.append("g")
        .selectAll("line")
        .data(y.ticks())
        .join("line")
            .attr("y1", d => 0.5 + y(d))
            .attr("y2", d => 0.5 + y(d))
            .attr("x1", margin.left)
            .attr("x2", cfg.width - margin.right));

    svg.selectAll(".axis-scatter").selectAll("*").remove();

    svg.append("g")
        .classed("axis-scatter", true)
        .call(xAxis);
    
    svg.append("g")
        .classed("axis-scatter", true)
        .call(yAxis);
    
    svg.append("g")
        .classed("axis-scatter", true)
        .call(grid);
    
    svg.selectAll("circle")
        .data(data)
        .join("circle")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("cx", d => x(d.x))
            .attr("cy", d => y(d.y))
            .attr("fill", "steelblue")
            .attr("r", 3);
}

function corrMatrix(data, cfg) {
    
}

function clearDG() {
    d3.select("#piechart").style("display", "none");
    d3.select("#histogram").style("display", "none");
    d3.select("#vis_info").style("display", "none");
    d3.select("#scatterplot_main_vis").style("display", "none");
}

