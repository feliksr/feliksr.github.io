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
        this.width = 800;
        this.height = 500;
        this.margin = {
            top: 0,
            right: 0,
            bottom: 100,
            left: 100
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

    createScales() {
        this.xScale = d3.scaleLinear()
            .range([0, this.width])
            .domain([d3.min(this.singleTrialData, d => d.time), d3.max(this.singleTrialData, d => d.time)]);
        
        this.yScale = d3.scaleLog()
            .range([this.height, 0])
            .domain([d3.min(this.singleTrialData, d => d.frequency), d3.max(this.singleTrialData, d => d.frequency)]);
    }

    initSvg() {
        this.containers.forEach(containerId => {
        this.container = this.containers[containerId]
            d3.select(this.container).select("svg").remove(); 

        this.svg = d3.select(this.container).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, 0)`);

        this.createScales();

        this.svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.yScale)
            .tickFormat(d => {return parseFloat(d.toPrecision(2))}));
            
        this.svg.append("g")
            .attr("class", "x-axis")
            .call(d3.axisBottom(this.xScale).ticks(5))
            .attr("transform", `translate(0, ${this.height})`);
        
        // this.svg.select(".x-axis")
        //     .append("text")
        //     .attr("class", "axis-label") 
        //     .attr("x", (this.width + this.margin.left) / 2)  
        //     .attr("y", this.height + (this.margin.bottom / 2))  
        //     .style("text-anchor", "middle")  
        //     .text("Time from Response (sec)");

        this.svg.select(".y-axis")
            .append("text")
            .attr("class", "axis-label")  
            // .attr("y", -this.margin.left / 2) 
            // .attr("x", this.height) 
            .attr("transform", "rotate(-90)") 
            .style("text-anchor", "middle") 
            .text("Frequency (Hz)");

        
        this.svg.selectAll("rect")
            .data(this.singleTrialData)
            .enter()
            .append("rect")
            .attr("x", d => this.xScale(d.time))
            .attr("y", d => this.yScale(d.frequency))
            .attr("width", this.width / new Set(this.singleTrialData.map(d => d.time)).size)
            .attr("height", this.height / new Set(this.singleTrialData.map(d => d.frequency)).size)
            .attr("fill", d => this.colorScale(d.power));
        });
    }
    drawHeatmap() {
        this.svg.selectAll("rect")
            .data(this.singleTrialData)
            .attr("fill", d => this.colorScale(d.power));
    }
}

const heatmap = new Heatmap(['#container1', '#container2', '#container3']);
heatmap.initialize();