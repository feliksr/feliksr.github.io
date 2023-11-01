const frequencyBins = [
    { min: 60, max: 200 },
    { min: 20, max: 60 },
    { min: 0, max: 20 }
];

const containers = ['#container1', '#container2', '#container3'];

const currentChannel = 1;  // Initialize with channel 1
let group;

function nextChannel() {
    currentChannel++;
    heatmap.channel = currentChannel;
    document.getElementById('trialSlider').disabled = true;
    heatmap.getData();
    heatmap.draw();
    colorbar.draw();
    document.getElementById('channelDisplay').textContent = `Channel: ${currentChannel}`;
}

function previousChannel() {
    if (currentChannel > 1) {
        currentChannel--;
        heatmap.channel = currentChannel;
        document.getElementById('trialSlider').disabled = true;
        heatmap.getData();
        heatmap.draw();
        colorbar.draw();
        document.getElementById('channelDisplay').textContent = `Channel: ${currentChannel}`;
    }
}

const groupButtons = document.querySelectorAll('.groupButton');
groupButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        // Set the group based on button's text content
        group = event.target.textContent
        console.log(group)
        heatmap.currentTrial = 1
        heatmap.getData()
        heatmap.draw()
        colorbar.draw();
        
        // Remove 'active' class from all group buttons
        groupButtons.forEach(btn => btn.classList.remove('active'));

        // Add 'active' class to clicked button
        this.classList.add('active');
    });
});

function getMaxColor(bin) {
    let powerValues = [];
    Object.values(heatmap.allTrialsData).forEach(array => {
        array.forEach(d => {
            if (d.frequency >= bin.min && d.frequency <= bin.max) {
                powerValues.push(d.power);
            };
        });
    })
    const maxColor = 3 * d3.deviation(powerValues)
    return maxColor
}

class Colorbar {
    constructor() {
        this.width = 30;
        this.numStops = 30;
    }

    initColorBar(svg, heightSVG) {
        const rectHeight = heightSVG / this.numStops;
    
        this.colorbarGroup = svg.append("g")
            .attr("transform", `translate(${heatmap.width + heatmap.margin.right / 2}, 0)`); 
    
        this.colorbarGroup.selectAll(".colorbar-rect")
            .data(d3.range(this.numStops))
            .enter().append("rect")
            .attr("class", "colorbar-rect")
            .attr("x", 0)
            .attr("y", (_, i) => i * rectHeight)
            .attr("width", this.width)
            .attr("height", rectHeight)
            .attr("fill", d => d3.interpolateViridis(d / (this.numStops)))
            .attr("shape-rendering", "crispEdges");
    }

    draw() {
        containers.forEach((container, index) => {
        const bin = frequencyBins[index];

        const maxColor = getMaxColor(bin)
        let colorbarScale = d3.scaleLinear()
                .domain([0, maxColor]) 
                .range([heatmap.svgHeights[index], 0]);  

        select(container).select(svg).append('g')
            .attr("class", "colorbar-axis")
            .call(d3.axisRight(colorbarScale).ticks(5))
            .attr("transform", `translate(${this.width}, 0)`); 
        })    
    }
}


class Heatmap {
    constructor() {
        this.width = 1000;
        this.height = 400;
        this.margin = {
            top: 0,
            right: 60,
            bottom: 20,
            left: 75
        };
        document.getElementById("y-axis-label").style.display = "none" // Hide "Frequency (Hz)" y-axis-label while Loading...
        
        this.channel = currentChannel;
        document.getElementById('channelDisplay').textContent = `Channel: ${this.channel}`;
                
        this.currentTrial = 1;
        document.getElementById('trialSlider').addEventListener('input', (event) => {
            this.currentTrial = event.target.value;
            document.getElementById('trialNumber').textContent = this.currentTrial
            this.singleTrialData = this.allTrialsData[this.currentTrial];
            heatmap.draw();
        });
    }

    async getData() {
        document.getElementById('trialSlider').disabled = true;
        document.getElementById("loadingText").style.display = "text-align:center";  // Display "Loading..."
        console.log(group)
        const response = await fetch(`https://froyzen.pythonanywhere.com/${group}/${this.channel}`);
        const responseData = await response.json();
        
        this.allTrialsData = responseData.trials_data;
        this.singleTrialData = this.allTrialsData[this.currentTrial];
        console.log(this.singleTrialData)

        document.getElementById('trialSlider').value = this.currentTrial;
        document.getElementById('trialNumber').textContent = this.currentTrial
        document.getElementById('trialSlider').max = Object.keys(this.allTrialsData).length;

        document.getElementById('trialSlider').disabled = false;
        document.getElementById("loadingText").style.display = "none";  // Hide "Loading..."
        document.getElementById("y-axis-label").style.display = "block" // Display "Frequency (Hz)"
    }

    initSVG() {
        this.svgHeights=[]
        containers.forEach((container,index) => {
            d3.select(container)
                .select("svg")
                .remove(); 

            const bin = frequencyBins[index];
            let filteredData = this.singleTrialData.filter(d => d.frequency >= bin.min && d.frequency <= bin.max);
            
            const allFreqBins = new Set(this.singleTrialData.map(d => d.frequency)).size
            const numFreqBins = new Set(filteredData.map(d => d.frequency)).size
            const numTimeBins = new Set(filteredData.map(d => d.time)).size
            const heightSVG = this.height * (numFreqBins/allFreqBins)
            this.svgHeights[index] = heightSVG
                // create heatmap SVGs
            const svg = d3.select(container).append("svg")
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", heightSVG + this.margin.bottom)
                .append("g")
                .attr("transform", `translate(${this.margin.left/2}, 0)`);
            
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
                .call(d3.axisBottom(this.xScale)
                    .ticks(5)
                    .tickFormat(''))  
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

            if (container === "#container3") { 
                d3.select(container).select("svg")
                    .attr("height", heightSVG + this.margin.bottom + 50);

                svg.select(".x-axis")
                    .call(d3.axisBottom(this.xScale).ticks(5)) 
                    .append("text")
                    .attr("class", "x-axis-label")
                    .attr("x", this.width / 2)  
                    .attr("y", this.margin.bottom + 40) 
                    .style("text-anchor", "middle")
                    .text("Time from Response (sec)")
            } 

            colorbar.initColorBar(svg,heightSVG); 
        })
    }
        
    draw() {
        containers.forEach((container, index) => {
            const bin = frequencyBins[index];
            console.log(this.singleTrialData)
            let filteredData = this.singleTrialData.filter(d => d.frequency >= bin.min && d.frequency <= bin.max);
            const colorScale = d3.scaleSequential(d3.interpolateViridis)
                .domain([0, getMaxColor(bin)])
            const svg = d3.select(container).select("svg");
            svg.selectAll("rect")
                .data(filteredData)
                .attr("fill", d => colorScale(d.power));
        });
    }
}

const heatmap = new Heatmap();
const colorbar = new Colorbar();

