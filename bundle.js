(function (d3$1) {
  'use strict';

  var phases = [[0,1],[1,2],[1,3]];
  var phaseLabels = ["Default vs Workshop", "Workshop vs Shared", "Workshop vs Autonomous"];
  var worldLabels = ["Default","Workshop","Shared","Autonomous"];
  var options = d3.select("#phase").selectAll("option")
  		.data(phases)  
  		.enter().append("option")
  		.text(function (d) { return phaseLabels[phases.indexOf(d)]; })
  		.attr("value", function (d) { return phases.indexOf(d); });  
  var updateFunctions = []; 
   

  function sum(obj ,keystoSum) {
    var keys = keystoSum === undefined ? Object.keys(obj) : keystoSum;
    return 	keys.reduce(function (s,key){
      //console.log(s, key, obj, obj[key])
      return s + parseFloat(obj[key]||0)
    } , 0);
    
  }
   
  var render = function (rawdata, keys, phase, name, datatype, svgid) {
    
    console.log("render",rawdata, keys, phase, svgid);
    var svg = d3$1.select("#"+ svgid);
    //svg.selectAll("*").remove();

  	var heigth = +svg.attr('height');
  	var width = +svg.attr('width');
    
    var margin =  { top: 20, right:20, bottom: 100, left: 90};
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = heigth - margin.top - margin.bottom;
    
    
    var xScale = d3$1.scaleLinear()
    	.range([0, innerWidth]);
    
    var yScale = d3$1.scaleBand()
      .range([0, innerHeight])
    	.padding(0.2);
    
    var zScale = d3.scaleOrdinal()
  		.range(["#b33040", "#d25c4d", "#f2b447"]);
  		
    console.log(zScale("Pkm Auto"));
    
    var g = svg.append('g')
    	.attr('transform', ("translate(" + (margin.left) + ", " + (margin.top) + ")"));
    
    
    var xAxisTickFormat = function (number) { return d3$1.format( '.3s')(number)
             .replace('G',' Mrd'); };
    if (datatype === "percentage"){
      xAxisTickFormat = function (t) { return t + "%"; };
    }
    
    
     var yAxisG = g.append("g")
  			.attr("transform", "translate(0,0)")
  			.attr("class", "y-axis");
    

             
    var xAxisG = g.append('g')
    	.attr('transform', ("translate(0, " + innerHeight + ")"))
    	.attr("class", "x-axis");
    
    xAxisG.select('.domain').remove();
    xAxisG.append('text')
    .transition().duration(750)
    	.attr('class', 'x-axis-label') 
    	.attr('y',80)
    	.attr('x',innerWidth /2)
      .attr('fill','black')
      .text(name);
    
  	 
    
    d3.select("#phase").on("change", function() {
      var this$1 = this;

      console.log("updateFunctions",updateFunctions);
      	updateFunctions.forEach(function (f) { return f.call(this$1, getSelPhase()); });
  			//update(rawdata,datatype,worlds)
  	});
    
    
    zScale.domain(keys);
     
   
   
    function update(rawdata, phase) {
      
      
      
      // only take selected worlds:
      var dataa  = rawdata.filter(function (d) { return d.phase == phase; });
      console.log("dataaa", rawdata, dataa, phase, phases[parseInt(phase)]);
      yScale.domain(["0","1"]);
      
      // keys = keys === undefined ? Object.keys(data[0]) : keys 
      console.log("keyssss", keys, dataa);
    	xScale.domain([0, d3$1.max(dataa, function (d) { return sum(d,keys); })]).nice();
      
      
      
      console.log("stack",d3.stack().keys(keys)(dataa));
      
      var group = g.selectAll("g.layer")
  			.data(d3.stack().keys(keys)(dataa), function (d) {
          //console.log("d.key",d, d.key)
          return d.key
        });
      group.enter().append("g")
          .classed("layer", true)
          .attr("fill", function (d) {
            //console.log("fill",d.key, zScale(d.key))
            return zScale(d.key)
        });
      
      var graf = g.selectAll("g.layer").selectAll('rect').data(function (d) { return d; }, function (e) { return e.data.world; }); 
       
    	graf.enter().append('rect')
      		.attr('y', function (d) {
      			return yScale(d.data.world)
    			})
          .attr('height',yScale.bandwidth()) 
          .merge(graf)
          .transition().duration(1000)
      		
      		.attr('width', function (d) {
              //console.log("width", d )
              return xScale(d[1]) - xScale(d[0])
          })
      
          .attr('x', function (d) {
              //console.log("x",d[0], xScale(d[0]))
              return xScale(d[0])
            });
      		
      
      
      var xAxis = d3$1.axisBottom(xScale)
    		.tickFormat(xAxisTickFormat)
    		.tickSize(-innerHeight);
      
   	 	g.selectAll(".x-axis").transition().duration(750).call(xAxis)
      .selectAll(".tick text")	
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-45)");
      
      
      
      var yAxisTickFormat = function (t) {
        console.log("t" , phases[phase]);
        var worldIdx = phases[phase][t];
        return worldLabels[worldIdx]
      };
      
      var yAxis = d3$1.axisLeft(yScale)
              .ticks(null, "s")
              .tickFormat(yAxisTickFormat);
      g.selectAll(".y-axis").transition().duration(750).call(yAxis); 
    
     /*
      g.append('text')
        .attr('class', 'title')
        .attr('y',-5)
        .text('Top 10 Most Populous Countries') */
    }
    update(rawdata,phase); 
    
    updateFunctions.push( function (phase) { return update(rawdata,phase); } );
    console.log("push updateFunctions",updateFunctions.length);
     
  };

    

  var url = 'https://hdmdeep.pythonanywhere.com/store/wsmodels/5e68b5fd470aac88a2373ee2/values/';

  var graphs = [
    		{name:"pkm", type:"percentage", find:'{"values.Pkm Auto":1,"values.Pkm ÖPNV":1,"values.Pkm CarSharing":1,"_id":0}' },
        {name:"vkm", type:"values", 		find:'{ "values.Vkm Auto" : 1 , "values.Vkm ÖPNV" : 1, "_id": 0 }' },
    { name:"c02", type:"values", find: '{ "values.CO2 Verbrauch Auto Gesamt" : 1 , "values.CO2 Verbrauch ÖPNV Gesamt" : 1 ,  "_id": 0 }'}
       ];
  function prepareData(data, datatype){
     
  		console.log("prepaaaaaaring", phases); 
      var newData = data.map( function (d,idx) {
          var vals = d.values; 
          var arr = Object.keys(vals).map(function (k) {
            var obj;

            return ( obj = {}, obj[k] = vals[k]["0.0"], obj ) 
          });
          var result = Object.assign.apply(Object, arr);
          result["orig_id"] = idx;
          return result 
      });
      var orgkeys = Object.keys(newData[0]);
      newData = newData.map(function (d) { return Object.assign(d, {"_total": sum(d)}); });
      var percentKeys = new Set();

      orgkeys.forEach(function (k) {
        newData.forEach(function (d) {
          if(k !== "_total" && k !== "orig_id"){
            var newKey = k + "_part";
            d[newKey] = d[k] / d["_total"] *100;
            percentKeys.add(newKey);
          } 
        });
      });
    
    	var result = [];
    	phases.forEach(function (worlds,pIdx) {
      	worlds.forEach(function (copyThis,wIdx) {
          var world = Object.assign({},newData[copyThis]);
          world["world"] = ""+wIdx; // id for graph!
          world["phase"] = ""+pIdx;
      		result.push(world);
      	});
      });
    	
    
    	// get correct keys
      var keys = orgkeys;
      if(datatype === "percentage"){
        keys = Array.from(percentKeys);
      }
    
    	return [result, keys]
  }

  function infografic(graph, index, phase) {
    d3$1.json(url + graph.find).then(function (data) { 
      console.log("infografic",graph, index, phase); 
      var ref = prepareData(data, graph.type);
      var result = ref[0];
      var keys = ref[1];
      render(result, keys, phase, graph.name, graph.type, "svg"+(index+1));

    });
  }

  function getSelPhase(){
   	var res =  d3$1.select("#phase").property("value"); 
    console.log("getSelPhase" , res);
    return res
  }

  function graphsUpdate(){
  	graphs.forEach(function (graph, index) { return infografic(graph,index,getSelPhase()); });
  }

  graphsUpdate();

}(d3));
//# sourceMappingURL=bundle.js.map
