let currentChannel = 1;  // Initialize with channel 1

function nextChannel() {
    document.getElementById("loadingText").style.display = "block";  // Display "Loading..."
    currentChannel++;
    heatmap.channel = currentChannel;
    document.getElementById('trialSlider').disabled = true;
    heatmap.initialize();
    document.getElementById('channelDisplay').textContent = `Channel: ${currentChannel}`;
}

function previousChannel() {
    document.getElementById("loadingText").style.display = "block";  // Display "Loading..."
    if (currentChannel > 1) {
        currentChannel--;
        heatmap.channel = currentChannel;
        document.getElementById('trialSlider').disabled = true;
        heatmap.initialize();
        document.getElementById('channelDisplay').textContent = `Channel: ${currentChannel}`;
    }
}

class Heatmap {
    constructor(containers) {
        this.containers = containers;
        this.width = 600;
        this.height = 200;
        this.margin = {
            top: 0,
            right: 50,
            bottom: 50,
            left: 75
        };
        this.channel = currentChannel;
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
        this.allTrialsData = responseData.trials_data;
        this.singleTrialData = this.allTrialsData[this.currentTrial];

        this.colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, responseData.maxColor]);
        
        this.initSvg();
        this.drawHeatmap();

        document.getElementById('trialSlider').max = this.numTrials;
        document.getElementById('trialSlider').disabled = false;
        document.getElementById("loadingText").style.display = "none";  // Hide "Loading..."
    }

    initSvg() {
        this.svgs = {};
        this.containers.forEach((container,index) => {
            d3.select(container)
                .select("svg")
                .remove(); 

        const bin = frequencyBins[index];
        const filteredData = this.singleTrialData.filter(d => d.frequency >= bin.min && d.frequency <= bin.max);
        
        const svg = d3.select(container).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.bottom)
            .attr("height", this.height + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, 0)`);
        
        this.xScale = d3.scaleLinear()
            .range([0, this.width])
            .domain([d3.min(this.singleTrialData, d => d.time), d3.max(this.singleTrialData, d => d.time)]);
        
        this.yScale = d3.scaleLog()
            .range([0, this.height])
            .domain([d3.max(filteredData, d => d.frequency),d3.min(filteredData, d => d.frequency)]);

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.yScale)
            .tickFormat(d => {return parseFloat(d.toPrecision(2))}));
            
        svg.append("g")
            .attr("class", "x-axis")
            .call(d3.axisBottom(this.xScale).ticks(5))
            .attr("transform", `translate(0, ${this.height})`);
        
        svg.select(".x-axis")
            .append("text")
            .attr("class", "axis-label")
            .attr("x", this.width / 2)
            .attr("y", 40) 
            .style("text-anchor", "middle")
            .text("Time from Response (sec)");

        svg.select(".y-axis")
            .append("text")
            .attr("class", "axis-label")
            .attr("y", -this.margin.left + 20)  
            .attr("x", -this.height / 2)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("Frequency (Hz)");
        
        const numFreqBins = new Set(filteredData.map(d => d.frequency)).size
        const numTimeBins = new Set(filteredData.map(d => d.time)).size
        svg.selectAll("rect")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("x", d => this.xScale(d.time))
            .attr("y", d => this.yScale(d.frequency) -  this.height/(numFreqBins -1))
            .attr("width", this.width /  (numTimeBins - 1))
            .attr("height", this.height / (numFreqBins - 1))
            .attr("shape-rendering", "crispEdges")
            .attr("fill", d => this.colorScale(d.power));
        })
    }
    drawHeatmap() {
        this.containers.forEach((container, index) => {
            const bin = frequencyBins[index];
            const filteredData = this.singleTrialData.filter(d => d.frequency >= bin.min && d.frequency <= bin.max);
            
            const svg = d3.select(container).select("svg");
            
            svg.selectAll("rect")
                .data(filteredData)
                .attr("fill", d => this.colorScale(d.power));
        });
    }
}

const heatmap = new Heatmap(['#container1', '#container2', '#container3']);
heatmap.initialize();

frequencyBins = [
    { min: 60, max: 200 },
    { min: 20, max: 60 },
    { min: 0, max: 20 }
];