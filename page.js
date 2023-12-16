// page.js
class Page{
    constructor() {
        // access server locally or online
        // this.url = `http://localhost:5000/`
        this.url = 'https://froyzen.pythonanywhere.com/'

        // Initial page parameters
        this.groupTypes = {
            'Target Stimulus' : ['Soccerball','Trophy','Vase'],
            'Stimulus Type' : ['Target','Distractor','Irrelevant'],
            'Stimulus Identity' :  ['Soccerball', 'Trophy', 'Vase']
        }
        this.subject = 'YDX'
        this.trial = 0
        this.channelIdx = 0
        this.run = 1

        this.meanTrials = false,
        this.ANOVA =  false,

        this.frequencyBins = [
            { min: 60, max: 200 },
            { min: 20, max: 60 },
            { min: 0, max: 20 }
        ];

        this.containers= ['#container1', '#container2', '#container3'];
       
        this.allButtons = new window.Buttons(this)
        this.allButtons.initialize()      
    }

    async getData() {

        const trialSlider  = document.getElementById('trialSlider')
        trialSlider.disabled = true 

        const channelSlider = document.getElementById('channelSlider')
        channelSlider.disabled = true

        const loadingText = document.getElementById('loadingText')
        loadingText.style.display = "block"; 

        const args = {

            stimGroup: this.stimGroup,
            group: this.group,
            allGroups: this.groupTypes[this.stimGroup],
            subject: this.subject,
            excludedTrialsContainer: this.allButtons.excludedTrialsContainer,
            meanTrials: this.meanTrials,
            ANOVA: this.ANOVA,
            allANOVA: this.allANOVA,
            run: this.run
        }
            
        this.response = await fetch(this.url + 'chans', {

                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(args)
            })
        
        this.responseData = await this.response.json();
        this.chanNumbers = this.responseData.chanNumbers
        this.chanLabels = this.responseData.chanLabels
        console.log(this.chanNumbers[this.channelIdx])

        document.getElementById('channelDisplay').textContent = `Channel ${this.chanNumbers[this.channelIdx]} ${this.chanLabels[this.channelIdx]}`;
   
       
        if (!this.ANOVA){
            
            this.allWaveletTrials = {}
            this.allWaveletChannels = {}
            this.allLFPChannels = {}
            this.allLFPTrials = {}
            this.numChans = 1
            
            args.currentChannel = this.chanNumbers[this.channelIdx]

            this.response = await fetch(this.url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(args)
            })
            
            this.responseData = await this.response.json();
            this.allWaveletTrials = this.responseData.trialsWavelet
            this.allLFPTrials = this.responseData.trialsLFP

            trialSlider.max = Object.keys(this.allWaveletTrials).length-1;
            trialSlider.disabled = false;
            this.singleTrialWavelet = this.allWaveletTrials[this.trial];
            this.singleTrialLFP = this.allLFPTrials[this.trial];
                
        } else {
        
            if (this.allANOVA){

             this.numChans = this.chanNumbers.length
                // this.numChans = 2
                 
            }else{

                this.numChans = 1

            }
            
            for (let chans = 0; chans < (this.numChans); chans++) { 
                
                console.log(chans)
                if (this.allANOVA){
                    args.currentChannel = this.chanNumbers[chans]

                } else {
                    args.currentChannel = this.chanNumbers[this.channelIdx]
                }
                console.log(`channel: ${args.currentChannel}`)

                this.response = await fetch(this.url + 'anova', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(args)
                })

                this.responseData = await this.response.json();
                console.log(this.responseData.channelsWavelet)
                this.allWaveletChannels[chans] = this.responseData.channelsWavelet[0]
                this.allLFPChannels[chans] = this.responseData.channelsLFP[0]
                this.singleChannelWavelet = this.allWaveletChannels[this.trial];
                this.singleChannelLFP = this.allLFPChannels[this.trial];
            }    

            channelSlider.max = this.numChans-1
            channelSlider.disabled = false;

        }            
           
        loadingText.style.display = "none"; 
       
        this.setContainers();
    }

    setContainers() {
        this.containers.forEach((container,index) => {
            const freqBin = this.frequencyBins[index];
            const heatmap = new window.Heatmap(this,container,freqBin);
            heatmap.initialize();
            const colorbar = new window.Colorbar(heatmap);
            colorbar.initColorbar();
        })
        this.LFPplot = new window.LFPchart(this)
        this.LFPplot.initialize()
    }


    getPowerValues(freqBin) {
        let powerValues = [];

        Object.entries(this.allWaveletTrials).forEach(([trialNum, array]) => {
            const trialButtonId = `trialButton-${this.group}-${trialNum}`;
            const isExcluded = document.getElementById(trialButtonId) !== null;
    
            if (!isExcluded) {
                array.forEach(d => {
                    if (d.frequency >= freqBin.min && d.frequency <= freqBin.max) {
                        powerValues.push(d.power);
                    };
                });
            }
        });
        return powerValues;
    }

    setColorScale(heatmap){
       const freqBin = heatmap.freqBin

       if (this.ANOVA ){
            heatmap.ANOVA = true
            heatmap.maxPower = this.allButtons.pVal.value
            heatmap.colorScale = d3.scaleSequential(d3.interpolateViridis).domain([heatmap.maxPower,0])
            document.getElementById('colorbarLabel').textContent = 'p-Value'
        }
        else {
            heatmap.ANOVA = false
            heatmap.maxPower = 3 * d3.deviation(this.getPowerValues(freqBin))
            heatmap.colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, heatmap.maxPower])
            document.getElementById('colorbarLabel').innerHTML = 'Power  (uV / Hz<sup>2</sup>)'
        }
    }
} 

const page = new Page;
