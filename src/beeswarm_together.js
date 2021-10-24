// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/beeswarm
function BeeswarmChart(data, {
    value = d => d, // convience alias for x
    label, // convenience alias for xLabel
    domain, // convenience alias for xDomain
    x = value, // given d in data, returns the quantitative x value
    title = null, // given d in data, returns the title
    radius = 3, // (fixed) radius of the circles
    padding = 1.5, // (fixed) padding between the circles
    marginTop = 10, // top margin, in pixels
    marginRight = 20, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 20, // left margin, in pixels
    width = 640, // outer width, in pixels
    height, // outer height, in pixels
    xLabel = label, // a label for the x-axis
    xDomain = domain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    colorMap = "steelblue"
  } = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const T = title == null ? null : d3.map(data, title);
    
    // Compute which data points are considered defined.
    const I = d3.range(X.length).filter(i => !isNaN(X[i]));
  
    // Compute default domains.
    if (xDomain === undefined) xDomain = d3.extent(X);
  
    // Construct scales and axes.
    const xScale = d3.scaleLinear(xDomain, xRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  
    // color here (take from pie chart) --------------------------
    let color = typeof colorMap == "string" ? colorMap : d3.scaleOrdinal()
        .domain([... new Set(data.map(colorMap))])
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), 
                data.length == 1 ? 2 : [... new Set(data.map(colorMap))].length).reverse());
                
    // Compute the y-positions.
    const Y = dodge(I.map(i => xScale(X[i])), radius * 2 + padding);
  
    // Compute the default height;
    if (height === undefined) height = d3.max(Y) + (radius + padding) * 2 + marginTop + marginBottom;
  
    // Given an array of x-values and a separation radius, returns an array of y-values.
    function dodge(X, radius) {
      const Y = new Float64Array(X.length);
      const radius2 = radius ** 2;
      const epsilon = 1e-3;
      let head = null, tail = null;
    
      // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
      function intersects(x, y) {
        let a = head;
        while (a) {
          const ai = a.index;
          if (radius2 - epsilon > (X[ai] - x) ** 2 + (Y[ai] - y) ** 2) return true;
          a = a.next;
        }
        return false;
      }
    
      // Place each circle sequentially.
      for (const bi of d3.range(X.length).sort((i, j) => X[i] - X[j])) {
  
        // Remove circles from the queue that can’t intersect the new circle b.
        while (head && X[head.index] < X[bi] - radius2) head = head.next;
    
        // Choose the minimum non-intersecting tangent.
        if (intersects(X[bi], Y[bi] = 0)) {
          let a = head;
          Y[bi] = Infinity;
          do {
            const ai = a.index;
            let y = Y[ai] + Math.sqrt(radius2 - (X[ai] - X[bi]) ** 2);
            if (y < Y[bi] && !intersects(X[bi], y)) Y[bi] = y;
            a = a.next;
          } while (a);
        }
    
        // Add b to the queue.
        const b = {index: bi, next: null};
        if (head === null) head = tail = b;
        else tail = tail.next = b;
      }
    
      return Y;
    }
  
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call(g => g.append("text")
            .attr("x", width)
            .attr("y", marginBottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));
  
    const dot = svg.append("g")
      .selectAll("circle")
      .data(I)
      .join("circle")
        .attr("cx", i => xScale(X[i]))
        .attr("cy", i => height - marginBottom - radius - padding - Y[i])
        .attr("r", radius)
        .style("fill", color);
  
    if (T) dot.append("title")
        .text(i => T[i]);
  
    return svg.node();
  }