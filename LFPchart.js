// LFPchart.js
class LFPchart {
    constructor(page) {
        this.page = page
        this.trial=this.page.trial
        this.data = this.page.allLFPTrials
        this.container = '#container4'
        this.width = 1000;
        this.height = 200;
        this.margin = {
            top: 0,
            right: 60,
            bottom: 20,
            left: 75
        };
    
        document.getElementById('trialSlider').addEventListener('input', (event) => {
            this.trial = event.target.value;
            this.initialize(); 
    
        })
    }
    
    initialize(){
        d3.select(this.container)
                .select("svg")
                .remove(); 

        const svg = d3.select(this.container).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.bottom + 60)

           
        const xScale = d3.scaleLinear()
            .rangeRound([0, this.width])
            .domain(d3.extent(this.data[this.trial], d => d.x));

        const yScale = d3.scaleLinear()
            .rangeRound([this.height, 0])
            .domain(d3.extent(this.data[this.trial], d => d.y));
        
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale).ticks(5))
            .attr("transform", `translate(${this.margin.left/2}, 0)`)

       
        svg.append("g")
            .attr("transform", `translate(${this.margin.left/2}, ${this.height})`)    
            .attr("class", "x-axis")
            .call(d3.axisBottom(xScale).ticks(5))
            .append("text")
            .attr("class", "x-axis-label")
            .attr("x", this.width / 2)  
            .attr("y", this.margin.bottom + 40) 
            .style("text-anchor", "middle")
            .style("font-size", "20px") 
            .text("Time from Response (sec)")

        svg.append("rect")
            .attr("x", this.margin.left / 2)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "#D3D3D3");
        
        const line = d3.line()
            .x(d => xScale(d.x)) 
            .y(d => yScale(d.y)); 
        
        svg.append('path')
            .attr("transform", `translate(${this.margin.left/2}, 0)`)
            .attr("d", line(this.data[this.trial]))
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 2);
    }
}            

window.LFPchart = LFPchart;

