import './style.css';
import * as d3 from "d3";
//import {Circle} from './circle';
import { create } from 'd3';
//import * as p5 from "./p5";

let animationPlaying = false;
let resetable = false;

let graph_Width = 660;
let graph_height = 200;
let sketchWidth = 660;
let sketchHeight = 400;

//global values for circles
let innerRadius = 4;
let outerRadius = 8;
let speed = 1;
let minWidth = () => 0 + innerRadius;
let maxWidth = () => sketchWidth - innerRadius;
let minHeight = () => 0 + innerRadius;
let maxHeight = () => sketchHeight - innerRadius;
let deadlines = 5;
let currentVacValue = 1;

let daysToSimulate = 365*1000;

let allCircles = [];
let color_healthy_inner, color_healthy_outer, color_ill_inner, color_ill_outer;
let color_vac_inner, color_vac_outer;

class Circle{
  constructor(canvas_widght, canvas_height, innerRadius, outerRadius, rnumber, status=1, speed=4){
      // this.innerRadius = innerRadius;
      // this.outerRadius = outerRadius;

      //Status: 1=Healty; 2=Infected; 3=Vacinated
      this.status = status;
      this.rnumber = rnumber;
      this.numOfInfected = 0;

      // this.minWidth = 0 + innerRadius;
      // this.maxWidth = canvas_widght - innerRadius;
      // this.minHeight = 0 + innerRadius;
      // this.maxHeight = canvas_height - innerRadius;
      let x = Math.random() * (maxWidth() - minWidth()) + minWidth();
      let y = Math.random() * (maxHeight() - minHeight()) + minHeight();
      let position = p5.Vector.random2D();
      position.x = x;
      position.y = y;
      this.position = position;

      this.velocity = p5.Vector.random2D().setMag(speed);
  }

  show(){
      //console.log("Draw at:" + this.position.x + " " + this.position.y);
      if(this.status == 1) fill(color_healthy_outer);
      if(this.status == 2) fill(color_ill_outer);
      if(this.status == 3) fill(color_vac_outer);
      noStroke();
      ellipse(this.position.x, this.position.y, outerRadius*2, outerRadius*2);
      if(this.status == 1) fill(color_healthy_inner);
      if(this.status == 2) fill(color_ill_inner);
      if(this.status == 3) fill(color_vac_inner);
      noStroke();
      ellipse(this.position.x, this.position.y, innerRadius*2, innerRadius*2);
  }

  update(){
    this.position.add(this.velocity);
    //check for edges
    //right edge
    if(this.position.x >= maxWidth()){
      if(this.velocity.x > 0){
        this.velocity.x = -1 * this.velocity.x;
      }
    }
    //left edge
    if(this.position.x <= minWidth()){
      if(this.velocity.x < 0){
        this.velocity.x = -1 * this.velocity.x;
      }
    }
    //right edge
    if(this.position.y >= maxHeight()){
      if(this.velocity.y > 0){
        this.velocity.y = -1 * this.velocity.y;
      }
    }
    //left edge
    if(this.position.y <= minHeight()){
      if(this.velocity.y < 0){
        this.velocity.y = -1 * this.velocity.y;
      }
    }
  }

  collisioncheck(){
    //only infected dots make collision check
    if(this.status == 2){
      //console.log("I perform collsion check");
      for(let i=0; i < allCircles.length; i++){
        if(allCircles[i].status != 1) continue; //Only Healty unfacinated circles can get infected.
        let distance = Math.sqrt(((allCircles[i].position.x - this.position.x)**2) + ((allCircles[i].position.y - this.position.y)**2));
        if(distance <= 2 * outerRadius){
          allCircles[i].status = 2;
          this.numOfInfected = this.numOfInfected + 1;
          //check whether you can infect more
          if(this.numOfInfected >= this.rnumber){
            break;
          }

        }
      }
    }
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

  //console.log(data);

  // List of groups = header of the csv files
  const keys = data.columns.slice(1);
  //console.log(keys);

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

  //console.log(data);

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
  allCircles = [];
  for(let i=0; i < 100; i++){
    allCircles.push(new Circle(sketchWidth, sketchHeight, innerRadius, outerRadius, 100, 1, speed));
  }
  allCircles[0].status = 2;
  syncVac();
}

let v1; 

window.setup = function (){

  color_healthy_inner = color(92, 159, 248);
  color_healthy_outer = color(189, 216, 252);
  color_ill_inner = color(245, 47, 62);
  color_ill_outer = color(249, 145, 152);
  color_vac_inner = color(105, 164, 155);
  color_vac_outer = color(185, 212, 208);

  v1 = createVector(1,4);
  let canvas = createCanvas(660, 400);
  canvas.parent('simulation-canvas');
  background(255, 0, 200);
}

window.draw = function(){
  background(240, 240, 240);

  //stats
  let number_ill = 0;

  allCircles.map((circle) =>{
    if(animationPlaying){
      circle.update();
      circle.collisioncheck();
      if(circle.status == 2){
        number_ill = number_ill + 1;
      }
    }
    circle.show();
  })
}

//connect JS to UI
document.getElementById("play-btn").onclick = () =>{
  if(resetable){
    document.getElementById("play-btn").value = "Start";
    animationPlaying = false;
    resetable = false;
    resetSimulation();
  }else{
    document.getElementById("play-btn").value = "Reset";
    resetable = true;
    startSimulation();
  }
}

document.getElementById("spread-input").oninput = () =>{
  let spread = parseInt(document.getElementById("spread-input").value);
  outerRadius = innerRadius + spread;
}

document.getElementById("dead-input").oninput = () =>{
  let value = parseInt(document.getElementById("dead-input").value);
  deadlines = value;
}

function syncVac(){
  let vacVal = parseInt(document.getElementById("vac-input").value);
  document.getElementById("vac-text").innerHTML = "Vaccination Rate: " + (vacVal * 10) + "%";
  let numberOfVacCircle = parseInt(allCircles.length * (vacVal / 10));
  let currentVacCircle = parseInt(allCircles.length * (currentVacValue / 10));

  
  for(let i=0; i < Math.max(currentVacCircle, numberOfVacCircle)  && i < allCircles.length; i++){
    if(i < numberOfVacCircle){
      allCircles[allCircles.length - 1 -i].status = 3; //Vaccinated
    }else{
      allCircles[allCircles.length - 1 - i].status = 1; //Healty
    }
  }
  allCircles[0].status = 2; //First is allways ill
  

  currentVacValue = vacVal;
}

document.getElementById("vac-input").oninput = () =>{
  syncVac();
}

function startSimulation(){
  animationPlaying = true;
  //diable all the input
  //document.getElementById("play-btn").disabled = true; //This can be reset
  document.getElementById("spread-input").disabled = true;
  document.getElementById("dead-input").disabled = true;
  document.getElementById("vac-input").disabled = true;
}

function resetSimulation(){
  setUpCircles();
  document.getElementById("spread-input").disabled = false;
  document.getElementById("dead-input").disabled = false;
  document.getElementById("vac-input").disabled = false;
}

drawGraph("#chart1");
drawGraphFromData("#chart2", testArray);
setUpCircles();
syncVac();