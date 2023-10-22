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
        this.trialsData = null;
        this.container = config.container || "#heatmapContainer";
        this.channel = config.channel || 1;
        document.getElementById('trialSlider').addEventListener('input', (event) => {
            this.currentTrial = event.target.value;
            const trialNumberDisplay = document.getElementById('trialNumber')
            trialNumberDisplay.textContent = this.currentTrial;
            this.updateTrial();
        });
              
        this.updateTrial();
    }

    async fetchData() {
        try {
            const response = await fetch(`https://froyzen.pythonanywhere.com/`);
            const responseData = await response.json();
            return responseData;

        } catch (error) {
            console.error("Error fetching data:", error);
            return {};
        }
    }
    
    initSvg() {
        this.svg = d3.select(this.container).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    }

    drawHeatmap() {
        const xScale = d3.scaleBand()
            .range([0, this.width])
            .domain(this.timeWavelet)
            .padding(0.05);

        const yScale = d3.scaleLog()
            .range([this.height, 0])
            .domain([d3.min(this.scale), d3.max(this.scale)]);

        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(this.data, d => d.power)]);

        // Draw the heatmap rectangles
        this.svg.selectAll("rect")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.time))
            .attr("y", d => yScale(d.frequency))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth()) 
            .attr("fill", d => colorScale(d.power));

        // Draw the x-axis. Using ticks to limit the number of labels displayed.
        this.svg.append("g")
            .attr("transform", `translate(0, ${this.height})`)
            .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => `${d.toFixed(1)}s`));  // Display values from timeWavelet as seconds

        // Draw the y-axis
        this.svg.append("g")
            .call(d3.axisLeft(yScale));
    }

    async updateTrial() {
        if (!this.trialsData) {
            const responseData = await this.fetchData();
            this.maxTrials = responseData.maxTrials;
            this.trialsData = responseData.data;
            this.timeWavelet = responseData.timeWavelet;  
            this.scale = responseData.scale; 
        }
        console.log('updateTrial called')
        this.data = this.trialsData[this.currentTrial-1];
        document.getElementById('trialSlider').max = 50;
        // Clear existing visualization
        d3.select(this.container).selectAll('*').remove();
        
        // Redraw the SVG and heatmap
        this.initSvg();
        this.drawHeatmap();
    }   
}

const config = {
    width: 2000,
    height: 2000,
    container: "#heatmapContainer",
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
    channel:2  // default channel
};

const heatmap = new Heatmap(config);
