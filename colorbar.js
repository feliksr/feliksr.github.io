//colorbar.js
class Colorbar {
    constructor(heatmap) {
        this.heatmap = heatmap;
        this.width = 30;
        this.numStops = 30;
    }

    initColorbar() {
        const rectHeight = this.heatmap.heightSVG / this.numStops;
        
        this.colorbarGroup = this.heatmap.svg.append("g")
            .attr("class", 'colorBar')
            .attr("transform", `translate(${this.heatmap.width + this.heatmap.margin.right}, 0)`)
    
        this.colorbarGroup.selectAll()
            .data(d3.range(this.numStops))
            .enter().append("rect")
            .attr("class", "colorbar-rect")
            .attr("x", 0)
            .attr("y", (_, i) => (this.numStops - i) * rectHeight - rectHeight)
            .attr("width", this.width)
            .attr("height", rectHeight)
            .attr("fill", d => d3.interpolateViridis(d / (this.numStops)))
            .attr("shape-rendering", "crispEdges");
        
        this.setInitScale();
        this.addDragBehavior();
    }

    setInitScale(){
        this.colorbarScale = d3.scaleLinear()
            .domain([0, this.heatmap.maxPower])
            .range([this.heatmap.heightSVG, 0]);

        this.drawColorBar();
    }

    drawColorBar() {
        this.colorbarGroup.select('.colorbarTicks').remove();

        this.colorbarGroup.append('g')
            .call(d3.axisRight(this.colorbarScale).ticks(5))
            .attr('class', 'colorbarTicks')
            .attr("transform", `translate(${this.width}, 0)`); 
    }  

    addDragBehavior() {

        const dragged = () => {
            const yPosition = d3.event.y * 0.02; 
            this.heatmap.maxPower = this.colorbarScale.invert(yPosition);
            this.colorbarScale.domain([0, this.heatmap.maxPower]);
            this.drawColorBar();
            this.heatmap.drawHeatmap();
            }

        const dragHandler = d3.drag()
            .on('drag', dragged);

        dragHandler(this.colorbarGroup);
    }
}

window.Colorbar = Colorbar;
