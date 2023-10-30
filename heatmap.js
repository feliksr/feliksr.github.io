let currentChannel = 1;  // Initialize with channel 1

function nextChannel() {
    currentChannel++;
    heatmap.channel = currentChannel;
    document.getElementById('trialSlider').disabled = true;
    heatmap.initialize();
    document.getElementById('channelDisplay').textContent = `Channel: ${currentChannel}`;
}

function previousChannel() {
    if (currentChannel > 1) {
        currentChannel--;
        heatmap.channel = currentChannel;
        document.getElementById('trialSlider').disabled = true;
        heatmap.initialize();
        document.getElementById('channelDisplay').textContent = `Channel: ${currentChannel}`;
    }
}

class Colorbar {
    constructor() {
        this.width = 20;
        this.numStops = 10;
    }

    generate(colorScale,svg,heightSVG,widthSVG,marginSVG) {
       
        const rectHeight = heightSVG / this.numStops;

        const colorRects = Array.from({ length: this.numStops }, (_, i) => {
            return {
                y: rectHeight * i,
                color: colorScale.domain(i)
            };
        });
        const colorbarGroup = svg.append("g")
            .attr("transform", `translate(${widthSVG + marginSVG / 2}, 0)`); 

        colorbarGroup.selectAll(".colorbar-rect")
            .data(colorRects)
            .enter().append("rect")
            .attr("class", "colorbar-rect")
            .attr("x", 0) 
            .attr("y", d => d.y)
            .attr("width", this.width)
            .attr("height", rectHeight)
            .attr("fill", d => colorScale(d.color))
            .attr("shape-rendering", "crispEdges");
    }
}

class Heatmap {
    constructor(containers) {
        this.containers = containers;
        this.width = 1000;
        this.height = 400;
        this.margin = {
            top: 0,
            right: 50,
            bottom: 20,
            left: 75
        };
        this.channel = currentChannel;
        document.getElementById('channelDisplay').textContent = `Channel: ${this.channel}`;
        document.getElementById("y-axis-label").style.display = "none" // Hide "Frequency (Hz)"


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
        document.getElementById("loadingText").style.display = "block";  // Display "Loading..."

        const response = await fetch(`https://froyzen.pythonanywhere.com/Target/${this.channel}`);
        const responseData = await response.json();
        
        this.allTrialsData = responseData.trials_data;
        this.singleTrialData = this.allTrialsData[this.currentTrial];
        this.colorScales = {};
        this.initSVG();
        this.drawHeatmap();

        document.getElementById('trialSlider').max = Object.keys(this.allTrialsData).length;
        document.getElementById('trialSlider').disabled = false;
        document.getElementById("loadingText").style.display = "none";  // Hide "Loading..."
        document.getElementById("y-axis-label").style.display = "block" // Display "Frequency (Hz)"
    }

    initSVG() {
        this.containers.forEach((container,index) => {
            d3.select(container)
                .select("svg")
                .remove(); 

            const bin = frequencyBins[index];
            const filteredData = this.singleTrialData.filter(d => d.frequency >= bin.min && d.frequency <= bin.max);
            
            const allFreqBins = new Set(this.singleTrialData.map(d => d.frequency)).size
            const numFreqBins = new Set(filteredData.map(d => d.frequency)).size
            const numTimeBins = new Set(filteredData.map(d => d.time)).size
            const heightSVG = this.height * (numFreqBins/allFreqBins)
            
                // Set color scaling
            let powerValues = [];
            Object.values(this.allTrialsData).forEach(array => {
                array.forEach(d => {
                    if (d.frequency >= bin.min && d.frequency <= bin.max) {
                        powerValues.push(d.power);
                    };
                });
            })
            
            const maxColor = 3 * d3.deviation(powerValues)
            const colorScale = d3.scaleSequential(d3.interpolateViridis)
                .domain([0, maxColor]);
            
            this.colorScales[index] = colorScale;
 
                // create heatmap SVGs
            const svg = d3.select(container).append("svg")
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", heightSVG + this.margin.bottom)
                .append("g")
                .attr("transform", `translate(${this.margin.left}, 0)`);
            
            this.xScale = d3.scaleLinear()
                .range([0, this.width])
                .domain([d3.min(this.singleTrialData, d => d.time), d3.max(this.singleTrialData, d => d.time)]);
            
            this.yScale = d3.scaleLog()
                .range([0, heightSVG])
                .domain([d3.max(filteredData, d => d.frequency),d3.min(filteredData, d => d.frequency)]);

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(this.yScale)
                .tickFormat(d => {return parseFloat(d.toPrecision(2))}));

            svg.append("g")
                .attr("class", "x-axis")
                .call(d3.axisBottom(this.xScale).ticks(5).tickFormat(''))  
                .attr("transform", `translate(0, ${heightSVG})`);

            svg.selectAll("rect")
                .data(filteredData)
                .enter()
                .append("rect")
                .attr("x", d => this.xScale(d.time))
                .attr("y", d => this.yScale(d.frequency) -  heightSVG/(numFreqBins -1))
                .attr("width", this.width /  (numTimeBins - 1))
                .attr("height", heightSVG / (numFreqBins - 1))
                .attr("shape-rendering", "crispEdges");

            colorbar.generate(colorScale,svg,heightSVG,this.width,this.margin.right);  

            if (container === "#container3") { 
                d3.select(container).select("svg")
                    .attr("height", heightSVG + this.margin.bottom + 50);

                svg.select(".x-axis")
                    .call(d3.axisBottom(this.xScale).ticks(5)) 
                    .append("text")
                    .attr("class", "x-axis-label")
                    .attr("x", this.width / 2)  
                    .attr("y", this.margin.bottom) 
                    .style("text-anchor", "middle")
                    .text("Time from Response (sec)")

            } 
        })
    }
        
    drawHeatmap() {
        this.containers.forEach((container, index) => {
            const bin = frequencyBins[index];
            const filteredData = this.singleTrialData.filter(d => d.frequency >= bin.min && d.frequency <= bin.max);
          
            const svg = d3.select(container).select("svg");
            svg.selectAll("rect")
                .data(filteredData)
                .attr("fill", d => this.colorScales[index](d.power));
        });
    }
}

const heatmap = new Heatmap(['#container1', '#container2', '#container3']);
const colorbar = new Colorbar();
heatmap.initialize();

frequencyBins = [
    { min: 60, max: 200 },
    { min: 20, max: 60 },
    { min: 0, max: 20 }
];