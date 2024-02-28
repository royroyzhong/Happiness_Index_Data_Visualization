class Smileyface {

  constructor(_config,_data,_year) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 20},
      colors: d3.scaleOrdinal(d3.schemeCategory10)
    }
    this.Data = _data;
    this.currYear = _year;
    this.initVis();
  }

  initVis() {
    let vis = this;
    //Initialize the size of the face and the offset, spacing radius of the eye.
    vis.width = 25;
    vis.height = 25;
    vis.eyeSpacing = 6;
    vis.eyeOffset = -4;
    vis.eyeRadius = 2.5;

    //Initialize the SVG
    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    //Initialize the title
    vis.svg.append('text')
      .attr('class', 'axis-title')
      .attr('x', 15)
      .attr('y', 1)
      .attr('dy', '.71em')
      .style("font-size", "13px")
      .text('Selected Countries:');
    vis.updateVis();
  }

  updateVis(){
    let vis = this;
    //Filter the data to get the correct year
    vis.data = vis.Data.filter((d) => {
      return d.year == vis.currYear;
    });
    //Get the selected country
    vis.selectedCountry = [];
    vis.data.forEach((d) => {
      if(d.display){
        vis.selectedCountry.push(d["Life Ladder"]);
      }
    })
    vis.renderVis();
  }
  renderVis(){
    let vis = this;
    //Remove the old smiley face
    d3.selectAll(vis.config.parentElement + " g").remove();
    //Create the new Smiley Face
    for(let j= 1; j<= vis.selectedCountry.length;j++){
      let life = vis.selectedCountry[j-1];
      for(let i = 1; i<=5; i++){
        vis.g = vis.svg.append('g')
          .attr('transform', `translate(${vis.width*i}, ${vis.height*j})`);

        //Create the gradient of the smily face
        let str = "grad" + i + j;
        let grad = vis.g.append("defs")
          .append("linearGradient")
          .attr("id", str)
          .attr("x1", "0%")
          .attr("x2", "100%")
          .attr("y1", "0%")
          .attr("y2", "0%");
        if((life - 2) >= 0){
          grad.append("stop").attr("offset", 1).style("stop-color", vis.config.colors(j));
          grad.append("stop").attr("offset", 0).style("stop-color", "white");
        }else{
          grad.append("stop").attr("offset", life/2).style("stop-color", vis.config.colors(j));
          grad.append("stop").attr("offset", 0).style("stop-color", "lightgrey");
        }
        life = life - 2>0 ? life-2:0;
        //Create the main face
        vis.circle = vis.g.append('circle')
          .attr('r', vis.height / 2)
          .attr('stroke', 'black')
          .attr('fill',`url(#${str})`);
        
        //Initialize the eye
        vis.eyesG = vis.g
          .append('g')
          .attr('transform', `translate(0, ${vis.eyeOffset})`);
        
        //Create the left eye
        vis.leftEye = vis.eyesG
          .append('circle')
          .attr('r', vis.eyeRadius)
          .attr('cx', -vis.eyeSpacing);
        
        //Create the right eye
        vis.rightEye = vis.eyesG
          .append('circle')
          .attr('r', vis.eyeRadius)
          .attr('cx', vis.eyeSpacing);
        
        //Create the mouth.
        vis.mouth = vis.g
          .append('path')
          .attr('d', d3.arc()({
            innerRadius: 1.5,
            outerRadius: 3.5,
            startAngle: Math.PI / 2,
            endAngle: Math.PI * 3 / 2
          }));

      }
    }
  }
}
