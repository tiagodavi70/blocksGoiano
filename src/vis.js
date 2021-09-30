
function generateSVG(id, viewPoint) {
    let svg = d3.select(id).append("svg")
        .attr("width", width)
        .attr("height", height)
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

    let sel = d3.select("#piechart");
    sel.append("div")
        .text("Pie Dimension")
    sel.append("select")
        .attr("id", "pieSelection")
        .on("change", function(e,d) {
            let dimSelected = d3.select(this).node().value;
            let data = generateData();
            pieChart(convertForPieChart(data, dimSelected), {"selector": "#piechart"});
            update();
        })
    
    sel = d3.select("#histogram");
    sel.append("div")
        .text("Histogram Dimension")
    sel.append("select")
        .attr("id", "histogramSelection")
        .on("change", function(e,d) {
            let dimSelected = d3.select(this).node().value;
            let data = generateData();
            histogramVis(convertForHistogram(data, dimSelected), {"selector": "#histogram"});
            update();
        })
    // d3.select("#vis_widgets").append("select")
    //     .attr("id", "boxplotSelection")
    //     .on("change", function(e,d) {
    //         let dimSelected = d3.select(this).node().value;
    //         let data = generateData();
    //         histogram(convertForHistogram(data, dimSelected));
    //         update();
    //     })
});

function updateOptions(id, type) {
    let f = type == "cat" ? d => d.generator.name == "Categorical" : d => d.generator.name != "Categorical" ;
    
    let cols = datagenerator.columns.filter(f); // column.generator
    let names = cols.map((d,i) => d.name);
    

    d3.select(id).selectAll("option")
        .data(names)
        .join("option")
            .attr("value", d => d)
            .text(d => d);
    return names;
}

function pieChart(data, cfg) {

    let pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const radius = Math.min(width, height) / 2 * 0.8;
    let arcLabel = d3.arc().innerRadius(radius).outerRadius(radius);

    let arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1)
    
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

function histogramVis(data, cfg) {

    let margin = {top: 20, right: 20, bottom: 30, left: 40};
    let color = "steelblue";
    
    let x = d3.scaleLinear()
        .domain([data[0].x0, data[data.length - 1].x1])
        .range([margin.left, width - margin.right])

    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.length)]).nice()
        .range([height - margin.bottom, margin.top])

    let xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80 ).tickSizeOuter(0))
        .call(g => g.append("text")
            .attr("x", width - margin.right)
            .attr("y", -4)
            .attr("fill", "currentColor")
            .attr("paint-order","stroke")
            .attr("stroke","#FFFFFF")
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .text(data.x))

    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
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

