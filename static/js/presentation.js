'use strict';

function random_color() {
    let r=Math.floor(Math.random() * 256);
    let g=Math.floor(Math.random() * 256);
    let b=Math.floor(Math.random() * 256);
    
    return d3.rgb(r, g, b);
}

function changeColor(elem) {
    //const svg = d3.select('#presentation');

    elem.selectAll('rect')
        .transition()
        .duration(2000)
        .ease(d3.easeBounce)
        .style('fill', function(d) {return random_color();});
}

function changeSize(elem) {
    //const svg = d3.select('#presentation');

    elem.selectAll('rect')
        .transition()
        .delay(3000)
        .duration(3000)
        .ease(d3.easeLinear)
        .attr('height', function(d) {return 20;})
        .attr('width', function(d) {return 10;})
        .attr('x', function(d) {return 10*(d%6);})
        .attr('y', function(d) {return Math.floor(d/6)*20;});
}

function presentation() {
    const svg = d3.select('#presentation');

    // Create the rectangles arrange
    svg.selectAll('rect')
        .data(d3.range(12))
        .enter()
        .append('rect')
        .attr('width', 50)
        .attr('height', 100)
        .attr('x', function(d) {return 50*(d%6);})
        .attr('y', function(d) {return Math.floor(d/6)*100;})
        .style('fill', function(d) {return random_color();});


    changeSize(svg);
    // Change the rectagles color each 3 seconds    
    setInterval(changeColor.bind(null, svg), 6000);
}



