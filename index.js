import  { 
	select, 
	arc, 
 	json, 
 	scaleLinear, 
 	max, 
 	scaleBand, 
 	axisLeft, 
 	axisBottom,
  format
  } from 'd3'; 
 

var phases = [[0,1],[1,2],[1,3]]
var phaseLabels = ["Default vs Workshop", "Workshop vs Shared", "Workshop vs Autonomous"]
var worldLabels = ["Default","Workshop","Shared","Autonomous"]
var options = d3.select("#phase").selectAll("option")
		.data(phases)  
		.enter().append("option")
		.text(d => phaseLabels[phases.indexOf(d)])
		.attr("value", d => phases.indexOf(d));  
const updateFunctions = [] 
 

function sum(obj ,keystoSum) {
  var keys = keystoSum === undefined ? Object.keys(obj) : keystoSum
  return 	keys.reduce((s,key)=> {
    //console.log(s, key, obj, obj[key])
    return s + parseFloat(obj[key]||0)
  } , 0);
  
}
 
const render = (rawdata, keys, phase, name, datatype, svgid) => {
  
  console.log("render",rawdata, keys, phase, svgid)
  const svg = select("#"+ svgid)
  //svg.selectAll("*").remove();

	const heigth = +svg.attr('height')
	const width = +svg.attr('width')
  
  const margin =  { top: 20, right:20, bottom: 100, left: 90}
  const innerWidth = width - margin.left - margin.right
  const innerHeight = heigth - margin.top - margin.bottom
  
  
  const xScale = scaleLinear()
  	.range([0, innerWidth])
  
  const yScale = scaleBand()
    .range([0, innerHeight])
  	.padding(0.2)
  
  var zScale = d3.scaleOrdinal()
		.range(["#b33040", "#d25c4d", "#f2b447"])
		
  console.log(zScale("Pkm Auto"))
  
  const g = svg.append('g')
  	.attr('transform', `translate(${margin.left}, ${margin.top})`)
  
  
  var xAxisTickFormat = number => 
  	format( '.3s')(number)
           .replace('G',' Mrd')
  if (datatype === "percentage"){
    xAxisTickFormat = (t) => t + "%"
  }
  
  
   var yAxisG = g.append("g")
			.attr("transform", `translate(0,0)`)
			.attr("class", "y-axis")
  

           
  const xAxisG = g.append('g')
  	.attr('transform', `translate(0, ${innerHeight})`)
  	.attr("class", "x-axis")
  
  xAxisG.select('.domain').remove();
  xAxisG.append('text')
  .transition().duration(750)
  	.attr('class', 'x-axis-label') 
  	.attr('y',80)
  	.attr('x',innerWidth /2)
    .attr('fill','black')
    .text(name)
  
	 
  
  d3.select("#phase").on("change", function() {
    console.log("updateFunctions",updateFunctions)
    	updateFunctions.forEach(f => f.call(this, getSelPhase()))
			//update(rawdata,datatype,worlds)
	})
  
  
  zScale.domain(keys);
   
 
 
  function update(rawdata, phase) {
    
    
    
    // only take selected worlds:
    var dataa  = rawdata.filter(d => d.phase == phase)
    console.log("dataaa", rawdata, dataa, phase, phases[parseInt(phase)])
    yScale.domain(["0","1"])
    const yValue = d => d.world
    
    // keys = keys === undefined ? Object.keys(data[0]) : keys 
    console.log("keyssss", keys, dataa)
  	xScale.domain([0, max(dataa, d => sum(d,keys))]).nice()
    
    
    
    console.log("stack",d3.stack().keys(keys)(dataa))
    
    var group = g.selectAll("g.layer")
			.data(d3.stack().keys(keys)(dataa), d =>  {
        //console.log("d.key",d, d.key)
        return d.key
      })
    group.enter().append("g")
        .classed("layer", true)
        .attr("fill", d => {
          //console.log("fill",d.key, zScale(d.key))
          return zScale(d.key)
      });
    
    var graf = g.selectAll("g.layer").selectAll('rect').data(d => d, e => e.data.world) 
     
  	graf.enter().append('rect')
    		.attr('y', d => {
    			return yScale(d.data.world)
  			})
        .attr('height',yScale.bandwidth()) 
        .merge(graf)
        .transition().duration(1000)
    		
    		.attr('width', d => {
            //console.log("width", d )
            return xScale(d[1]) - xScale(d[0])
        })
    
        .attr('x', d => {
            //console.log("x",d[0], xScale(d[0]))
            return xScale(d[0])
          })
    		
    
    
    const xAxis = axisBottom(xScale)
  		.tickFormat(xAxisTickFormat)
  		.tickSize(-innerHeight)
    
 	 	g.selectAll(".x-axis").transition().duration(750).call(xAxis)
    .selectAll(".tick text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
    
    
    
    var yAxisTickFormat = (t) => {
      console.log("t" , phases[phase])
      var worldIdx = phases[phase][t]
      return worldLabels[worldIdx]
    }
    
    const yAxis = axisLeft(yScale)
            .ticks(null, "s")
            .tickFormat(yAxisTickFormat)
    g.selectAll(".y-axis").transition().duration(750).call(yAxis) 
  
   /*
    g.append('text')
      .attr('class', 'title')
      .attr('y',-5)
      .text('Top 10 Most Populous Countries') */
  }
  update(rawdata,phase) 
  
  updateFunctions.push( (phase) => update(rawdata,phase) )
  console.log("push updateFunctions",updateFunctions.length)
   
};

  

var url = 'https://hdmdeep.pythonanywhere.com/store/wsmodels/5e68b5fd470aac88a2373ee2/values/'
var pkm = '{"values.Pkm Auto":1,"values.Pkm ÖPNV":1,"values.Pkm CarSharing":1,"_id":0}'

var graphs = [
  		{name:"pkm", type:"percentage", find:'{"values.Pkm Auto":1,"values.Pkm ÖPNV":1,"values.Pkm CarSharing":1,"_id":0}' },
      {name:"vkm", type:"values", 		find:'{ "values.Vkm Auto" : 1 , "values.Vkm ÖPNV" : 1, "_id": 0 }' },
  { name:"c02", type:"values", find: '{ "values.CO2 Verbrauch Auto Gesamt" : 1 , "values.CO2 Verbrauch ÖPNV Gesamt" : 1 ,  "_id": 0 }'}
     ];
function prepareData(data, datatype){
   
		console.log("prepaaaaaaring", phases) 
    var newData = data.map( (d,idx) => {
        var vals = d.values 
        var arr = Object.keys(vals).map(k => {
          return {[k]:vals[k]["0.0"]} 
        })
        var result = Object.assign(...arr)
        result["orig_id"] = idx
        return result 
    })
    var orgkeys = Object.keys(newData[0])
    newData = newData.map(d => Object.assign(d, {"_total": sum(d)}))
    var percentKeys = new Set()

    orgkeys.forEach(k =>{
      newData.forEach(d => {
        if(k !== "_total" && k !== "orig_id"){
          var newKey = k + "_part"
          d[newKey] = d[k] / d["_total"] *100
          percentKeys.add(newKey)
        } 
      })
    })
  
  	var result = []
  	phases.forEach((worlds,pIdx) => {
    	worlds.forEach((copyThis,wIdx) => {
        var world = Object.assign({},newData[copyThis])
        world["world"] = ""+wIdx // id for graph!
        world["phase"] = ""+pIdx
    		result.push(world)
    	})
    })
  	
  
  	// get correct keys
    var keys = orgkeys
    if(datatype === "percentage"){
      keys = Array.from(percentKeys)
    }
  
  	return [result, keys]
}

function infografic(graph, index, phase) {
  json(url + graph.find).then(data => { 
    console.log("infografic",graph, index, phase) 
    const [result, keys] = prepareData(data, graph.type)
    render(result, keys, phase, graph.name, graph.type, "svg"+(index+1))

  });
}

function getSelPhase(){
 	var res =  select("#phase").property("value") 
  console.log("getSelPhase" , res)
  return res
}

function graphsUpdate(){
	graphs.forEach((graph, index) => 	infografic(graph,index,getSelPhase()))
}

graphsUpdate()









