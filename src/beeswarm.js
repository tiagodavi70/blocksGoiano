
function Beeswarm(data, cfg) {

    let y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Ry))
        .range([cfg.height - 60, 40]);

    let x = d3.scaleBand(data.map(d=>d.Rx), [80, width - 20]);

    let color = d3.scaleOrdinal()
        .domain([... new Set(data.map(d => d.color))])
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), 
                data.length == 1 ? 2 : [... new Set(data.map(d=>d.color))].length));

    let svg = d3.select(cfg.selector).select("svg");
    svg.selectAll("*").remove();

    let simulation = d3.forceSimulation(data)
      .force("y", d3.forceY(d => y(d.Ry)).strength(1))
      .force("x", d3.forceX(d => x(d.Rx)))
    //   .force("x", d3.forceX(width / 2))
      .force("collide", d3.forceCollide(4))
      .stop();

    for (var i = 0; i < 120; ++i) simulation.tick();

    svg.append("g")
      .attr("transform", "translate(40,0)")
      .call(d3.axisLeft(y).ticks(10));
    
    svg.append("g")
      .attr("transform", "translate(-40," + (cfg.height -60)+ ")")
      .call(d3.axisBottom(x));
    
    svg.append("g")
        .selectAll("g").data(data)
    .join("circle")
        .attr("r", 3)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .style("fill", d => color(d.color));

}
