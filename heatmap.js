class Heatmap {
    constructor(page,container,freqBin) {
        this.page = page
        this.container = container
        this.freqBin = freqBin
        this.width = 1000;
        this.height = 400;
        this.margin = {
            top: 0,
            right: 100,
            bottom: 20,
            left: 50
        };

        document.getElementById('trialSlider').addEventListener('input', () => {

            this.singleTrialData = this.page.allWaveletTrials[this.page.trial];
            this.filteredData = this.singleTrialData.filter(d => d.frequency >= this.freqBin.min && d.frequency <= this.freqBin.max);
            this.drawHeatmap(); 
            
        const trialButtonId = `trialButton-${this.page.group}-${this.page.trial}`;
        const trialButton = document.getElementById(trialButtonId);

        if (trialButton) {
            this.page.excludeTrialButton.classList.add('active');
        } else {
            this.page.excludeTrialButton.classList.remove('active');
        }

        });
    }

    initialize() {
            d3.select(this.container)
                .select("svg")
                .remove(); 

            this.filteredData = this.page.singleTrialWavelet.filter(d => d.frequency >= this.freqBin.min && d.frequency <= this.freqBin.max);

            const allFreqBins = new Set(this.page.singleTrialWavelet.map(d => d.frequency)).size
            const numFreqBins = new Set(this.filteredData.map(d => d.frequency)).size
            const numTimeBins = new Set(this.filteredData.map(d => d.time)).size
            this.heightSVG = this.height * (numFreqBins/allFreqBins)
            
            this.xScale = d3.scaleLinear()
                .range([0, this.width])
                .domain([d3.min(this.filteredData, d => d.time), d3.max(this.filteredData, d => d.time)]);
            
            this.yScale = d3.scaleLog()
                .range([0, this.heightSVG])
                .domain([d3.max(this.filteredData, d => d.frequency),d3.min(this.filteredData, d => d.frequency)]);
                      
            // create heatmap SVGs
            this.svg = d3.select(this.container).append("svg")
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", this.heightSVG + this.margin.bottom)

            this.heatMap = this.svg.append('g')
                .attr("transform", `translate(${this.margin.left}, 0)`)
                .append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(this.yScale)
                .tickFormat(d => {return parseFloat(d.toPrecision(2))}))
            
            this.heatMap.append("g")
                .attr("class", "x-axis")
                .call(d3.axisBottom(this.xScale)
                    .ticks(5)
                    .tickFormat(''))  
                .attr("transform", `translate(0, ${this.heightSVG})`);
                
            
            this.heatMap.selectAll()
                .data(this.filteredData)
                .enter().append("rect")
                .attr("x", d => this.xScale(d.time))
                .attr("y", d => this.yScale(d.frequency) -  this.heightSVG/(numFreqBins -1))
                .attr("width", this.width /  (numTimeBins - 1))
                .attr("height", this.heightSVG / (numFreqBins - 1))
                .attr("shape-rendering", "crispEdges");

            
            this.page.setColorScale(this)           
            this.drawHeatmap();
    }
        
    drawHeatmap() {
        this.svg.selectAll("rect")
            .data(this.filteredData)
            .attr("fill", d => this.colorScale(d.power));
    }

}

window.Heatmap = Heatmap;
