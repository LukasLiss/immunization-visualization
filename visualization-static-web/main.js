// import './style.css';
// import * as d3 from "d3";
//import {Circle} from './circle';
// import { create } from 'd3';
//import * as p5 from "./p5";

let GLOBAL = 100;
let graph_Width = 660;
let graph_height = 200;
let sketchWidth = 660;
let sketchHeight = 400;

let allCircles = [];

class Circle{
  constructor(canvas_widght, canvas_height, innerRadius, outerRadius, position, speed=4){
      this.innerRadius = innerRadius;
      this.outerRadius = outerRadius;

      // let minWidth = 0 + innerRadius;
      // let maxWidth = canvas_widght - innerRadius;
      // let minHeight = 0 + innerRadius;
      // let maxHeight = canvas_height - innerRadius;
      // let x = Math.random() * (maxWidth - minWidth) + minWidth;
      // let y = Math.random() * (maxHeight - minHeight) + minHeight;
      // this.position = createVector(x,y);
      this.position = position

      this.velocity = p5.Vector.random2D().setMag(speed);
  }

  show(){
      circle(this.position.x, this.position.y, this.innerRadius);
  }
}

function drawGraph(divID){
  // set the dimensions and margins of the graph
  const margin = {top: 60, right: 230, bottom: 50, left: 50},
  width = graph_Width - margin.left - margin.right,
  height = graph_height - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3.select(divID)
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        `translate(${margin.left}, ${margin.top})`);

  // Parse the Data
  //d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered_wide.csv").then( function(data) {
    d3.csv("./cleaned-world-data-in-million.csv", 
      d => {
        return {
              date: d3.timeParse("%Y-%m-%d")(d.date),
              Total_Cases : parseInt(d.Total_Cases),
              Total_Deaths : parseInt(d.Total_Deaths)
            }
          }
    ).then( function(data) {

  //////////
  // GENERAL //
  //////////

  console.log(data);

  // List of groups = header of the csv files
  const keys = data.columns.slice(1);
  console.log(keys);

  // color palette
  const color = d3.scaleOrdinal()
  .domain(keys)
  .range(d3.schemeSet2);

  //stack the data?
  const stackedData = d3.stack()
  .keys(keys)
  (data)



  //////////
  // AXIS //
  //////////

  // Add X axis
  const x = d3.scaleTime()
  .domain(d3.extent(data, function(d) { return d.date; }))
  .range([ 0, width ]);
  const xAxis = svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x).ticks(5))

  // Add X axis label:
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height+40 )
    .text("Time (year)");

  // Add Y axis label:
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", 0)
    .attr("y", -20 )
    .text("# of People in Million")
    .attr("text-anchor", "start")

  // Add Y axis
  const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => +d.Total_Cases + d.Total_Deaths)])
  .range([ height, 0 ]);
  svg.append("g")
  .call(d3.axisLeft(y).ticks(5))



  //////////
  // BRUSHING AND CHART //
  //////////

  // Add a clipPath: everything out of this area won't be drawn.
  const clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width )
    .attr("height", height )
    .attr("x", 0)
    .attr("y", 0);

  // Add brushing
  const brush = d3.brushX()                 // Add the brush feature using the d3.brush function
    .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
    .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

  // Create the scatter variable: where both the circles and the brush take place
  const areaChart = svg.append('g')
  .attr("clip-path", "url(#clip)")

  // Area generator
  const area = d3.area()
  .x(function(d) { return x(d.data.date); })
  .y0(function(d) { return y(d[0]); })
  .y1(function(d) { return y(d[1]); })

  // Show the areas
  areaChart
  .selectAll("mylayers")
  .data(stackedData)
  .join("path")
    .attr("class", function(d) { return "myArea " + d.key })
    .style("fill", function(d) { return color(d.key); })
    .attr("d", area)

  // Add the brushing
  areaChart
  .append("g")
    .attr("class", "brush")
    .call(brush);

  let idleTimeout
  function idled() { idleTimeout = null; }

  // A function that update the chart for given boundaries
  function updateChart(event,d) {

  extent = event.selection

  // If no selection, back to initial coordinate. Otherwise, update X axis domain
  if(!extent){
    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
    x.domain(d3.extent(data, function(d) { return d.date; }))
  }else{
    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
  }

  // Update axis and area position
  xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5))
  areaChart
    .selectAll("path")
    .transition().duration(1000)
    .attr("d", area)
  }



  //////////
  // HIGHLIGHT GROUP //
  //////////

  // What to do when one group is hovered
  const highlight = function(event,d){
    // reduce opacity of all groups
    d3.selectAll(".myArea").style("opacity", .1)
    // expect the one that is hovered
    d3.select("."+d).style("opacity", 1)
  }

  // And when it is not hovered anymore
  const noHighlight = function(event,d){
    d3.selectAll(".myArea").style("opacity", 1)
  }



  //////////
  // LEGEND //
  //////////

  // Add one dot in the legend for each name.
  const size = 20
  svg.selectAll("myrect")
    .data(keys)
    .join("rect")
      .attr("x", 400)
      .attr("y", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("width", size)
      .attr("height", size)
      .style("fill", function(d){ return color(d)})
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight)

  // Add one dot in the legend for each name.
  svg.selectAll("mylabels")
    .data(keys)
    .join("text")
      .attr("x", 400 + size*1.2)
      .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
      .style("fill", function(d){ return color(d)})
      .text(function(d){ return d})
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight)

  })
}

function drawGraphFromData(divID, data){
  // set the dimensions and margins of the graph
  const margin = {top: 60, right: 230, bottom: 50, left: 50},
  width = graph_Width - margin.left - margin.right,
  height = graph_height - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3.select(divID)
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        `translate(${margin.left}, ${margin.top})`);

  //////////
  // GENERAL //
  //////////

  console.log(data);

  // List of groups = header of the csv files
  const keys = ['Total_Cases', 'Total_Deaths'];

  // color palette
  const color = d3.scaleOrdinal()
  .domain(keys)
  .range(d3.schemeSet2);

  //stack the data?
  const stackedData = d3.stack()
  .keys(keys)
  (data)



  //////////
  // AXIS //
  //////////

  // Add X axis
  const x = d3.scaleTime()
  .domain(d3.extent(data, function(d) { return d.date; }))
  .range([ 0, width ]);
  const xAxis = svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x).ticks(5))

  // Add X axis label:
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height+40 )
    .text("Time (year)");

  // Add Y axis label:
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", 0)
    .attr("y", -20 )
    .text("# of People in Million")
    .attr("text-anchor", "start")

  // Add Y axis
  const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => +d.Total_Cases + d.Total_Deaths)])
  .range([ height, 0 ]);
  svg.append("g")
  .call(d3.axisLeft(y).ticks(5))



  //////////
  // BRUSHING AND CHART //
  //////////

  // Add a clipPath: everything out of this area won't be drawn.
  const clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width )
    .attr("height", height )
    .attr("x", 0)
    .attr("y", 0);

  // Add brushing
  const brush = d3.brushX()                 // Add the brush feature using the d3.brush function
    .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
    .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

  // Create the scatter variable: where both the circles and the brush take place
  const areaChart = svg.append('g')
  .attr("clip-path", "url(#clip)")

  // Area generator
  const area = d3.area()
  .x(function(d) { return x(d.data.date); })
  .y0(function(d) { return y(d[0]); })
  .y1(function(d) { return y(d[1]); })

  // Show the areas
  areaChart
  .selectAll("mylayers")
  .data(stackedData)
  .join("path")
    .attr("class", function(d) { return "myArea " + d.key })
    .style("fill", function(d) { return color(d.key); })
    .attr("d", area)

  // Add the brushing
  areaChart
  .append("g")
    .attr("class", "brush")
    .call(brush);

  let idleTimeout
  function idled() { idleTimeout = null; }

  // A function that update the chart for given boundaries
  function updateChart(event,d) {

  extent = event.selection

  // If no selection, back to initial coordinate. Otherwise, update X axis domain
  if(!extent){
    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
    x.domain(d3.extent(data, function(d) { return d.date; }))
  }else{
    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
  }

  // Update axis and area position
  xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5))
  areaChart
    .selectAll("path")
    .transition().duration(1000)
    .attr("d", area)
  }



  //////////
  // HIGHLIGHT GROUP //
  //////////

  // What to do when one group is hovered
  const highlight = function(event,d){
    // reduce opacity of all groups
    d3.selectAll(".myArea").style("opacity", .1)
    // expect the one that is hovered
    d3.select("."+d).style("opacity", 1)
  }

  // And when it is not hovered anymore
  const noHighlight = function(event,d){
    d3.selectAll(".myArea").style("opacity", 1)
  }



  //////////
  // LEGEND //
  //////////

  // Add one dot in the legend for each name.
  const size = 20
  svg.selectAll("myrect")
    .data(keys)
    .join("rect")
      .attr("x", 400)
      .attr("y", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("width", size)
      .attr("height", size)
      .style("fill", function(d){ return color(d)})
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight)

  // Add one dot in the legend for each name.
  svg.selectAll("mylabels")
    .data(keys)
    .join("text")
      .attr("x", 400 + size*1.2)
      .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
      .style("fill", function(d){ return color(d)})
      .text(function(d){ return d})
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight)
}

let testArray = [
  {date: new Date("2020-03-01"), Total_Cases: parseInt('1'), Total_Deaths: parseInt('1')},
  {date: new Date("2020-04-01"), Total_Cases: parseInt('2'), Total_Deaths: parseInt('2')},
  {date: new Date("2020-05-01"), Total_Cases: parseInt('3'), Total_Deaths: parseInt('2')},
  {date: new Date("2020-06-01"), Total_Cases: parseInt('4'), Total_Deaths: parseInt('2')},
  {date: new Date("2020-07-01"), Total_Cases: parseInt('5'), Total_Deaths: parseInt('4')},
  {date: new Date("2020-08-01"), Total_Cases: parseInt('6'), Total_Deaths: parseInt('4')},
  {date: new Date("2020-09-01"), Total_Cases: parseInt('7'), Total_Deaths: parseInt('4')},
  {date: new Date("2020-10-01"), Total_Cases: parseInt('8'), Total_Deaths: parseInt('4')},
  {date: new Date("2020-11-01"), Total_Cases: parseInt('9'), Total_Deaths: parseInt('4')},
  {date: new Date("2020-12-01"), Total_Cases: parseInt('10'), Total_Deaths: parseInt('4')},
  {date: new Date("2021-01-01"), Total_Cases: parseInt('11'), Total_Deaths: parseInt('4')},
  {date: new Date("2021-02-01"), Total_Cases: parseInt('12'), Total_Deaths: parseInt('4')}
];

function setUpCircles(){
  let innerRadius = 5;
  let outerRadius = 7;

  let minWidth = 0 + innerRadius;
  let maxWidth = sketchWidth - innerRadius;
  let minHeight = 0 + innerRadius;
  let maxHeight = sketchHeight - innerRadius;
  let x = Math.random() * (maxWidth - minWidth) + minWidth;
  let y = Math.random() * (maxHeight - minHeight) + minHeight;
  console.log(window.p5);
  let position = p5.Vector.random2D();
  position.x = x;
  position.y = y;

  allCircles.push(new Circle(sketchWidth, sketchHeight, 5, 7, position));
}

let v1; 

window.setup = function (){
  v1 = createVector(1,4);
  console.log("Setup + Global:" + GLOBAL);
  let canvas = createCanvas(660, 400);
  canvas.parent('simulation-canvas');
  console.log(canvas);
  background(255, 0, 200);
}

window.draw = function(){
  allCircles.map((circle) =>{
    console.log("Show");
    circle.show();
  })
}

drawGraph("#chart1");
drawGraphFromData("#chart2", testArray);
setUpCircles();