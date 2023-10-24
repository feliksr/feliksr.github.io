class Heatmap {
    constructor(config) {
        this.width = config.width || 800;
        this.height = config.height || 500;
        this.margin = {
            top: config.marginTop || 20,
            right: config.marginRight || 20,
            bottom: config.marginBottom || 20,
            left: config.marginLeft || 20
        };
        this.container = config.container || "#heatmapContainer";
        this.channel = config.channel || 1;
        document.getElementById('channelDisplay').textContent = `Channel: ${this.channel}`;

        this.currentTrial = 1;
        document.getElementById('trialSlider').disabled = true;
        document.getElementById('trialSlider').addEventListener('input', (event) => {
            this.currentTrial = event.target.value;
            const trialNumberDisplay = document.getElementById('trialNumber')
            trialNumberDisplay.textContent = this.currentTrial;
            this.singleTrialData = this.allTrialsData[this.currentTrial];
            this.drawHeatmap();
        });
    }
    
    async initialize() {
        const response = await fetch(`https://froyzen.pythonanywhere.com/Target/${this.channel}`);
        const responseData = await response.json();
        this.numTrials = responseData.numTrials;
        this.timeWavelet = responseData.timeWavelet;  
        this.scale = responseData.scale;
        this.allTrialsData = responseData.trials_data;
        this.singleTrialData = this.allTrialsData[this.currentTrial];
        this.colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, responseData.maxColor]);
        
        this.initSvg();
        this.drawHeatmap();
        document.getElementById('trialSlider').max = this.numTrials;
        document.getElementById('trialSlider').disabled = false;
    }

    initSvg() {
        this.svg = d3.select(this.container).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        
        const xScale = d3.scaleBand()
            .range([0, this.width])
            .domain(this.timeWavelet)
            .padding(0);
    
        const yScale = d3.scaleLog()
            .range([this.height, 0])
            .domain([d3.min(this.scale), d3.max(this.scale)])
            
    
        // Calculate height of a heatmap rectangle
        const calculateRectHeight = (frequency) => {
            const index = this.scale.indexOf(frequency);
            // if (index === this.scale.length - 1) return 2;
            return yScale(this.scale[index]) - yScale(this.scale[index + 1]);
        };
    
        // Create the initial set of rectangles based on the data.
        this.svg.selectAll("rect")
            .data(this.singleTrialData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.time))
            .attr("y", d => yScale(d.frequency))
            .attr("width", xScale.bandwidth())
            .attr("height", d => calculateRectHeight(d.frequency))
            .attr("fill", d => this.colorScale(d.power))
            // .attr("stroke", "none") 
            // .attr("stroke-width", 0);
    }
    
    drawHeatmap() {
        this.svg.selectAll("rect")
            .data(this.singleTrialData)
            .attr("fill", d => this.colorScale(d.power));
    }
}

const config = {
    width: 800,
    height: 500,
    container: "#heatmapContainer",
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
    channel:2  // default channel
};

const heatmap = new Heatmap(config);
heatmap.initialize();

