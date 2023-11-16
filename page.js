// page.js
class Page{
    constructor() {
        // Initial page parameters
        this.allGroups = ['Target','Distractor','Irrelevant']
        this.trial = 1,
        this.channel = 1,
        this.meanTrials = false,
        this.ANOVA =  false,
        this.frequencyBins = [
            { min: 60, max: 200 },
            { min: 20, max: 60 },
            { min: 0, max: 20 }
        ];

        this.excludedTrialsContainer = {
            'Target': document.getElementById('excludedTrialsContainerTarget'),
            'Distractor': document.getElementById('excludedTrialsContainerDistractor'),
            'Irrelevant': document.getElementById('excludedTrialsContainerIrrelevant')
        }

        const ids = [
            'trialSlider', 'colorbarLabel', 'channelDisplay', 'ANOVAbutton',
            'meanTrialsButton', 'loadingText', 'excludeTrialButton',
            'pVal', 'prevChan', 'nextChan', 'yAxisLabel', 'trialNumber'
        ];
        
        ids.forEach(id => {
            this[id] = document.getElementById(id);
        });
    
        this.excludeTrialButton.addEventListener('click', () => {
            const trialButtonId = `trialButton-${this.group}-${this.trial}`;
            const trialButton = document.getElementById(trialButtonId);
        
            if (trialButton) {
                this.excludedTrialsContainer[this.group].removeChild(trialButton);
            } else {
                const button = document.createElement('button');
                button.textContent = `Trial ${this.trial}`;
                button.id = trialButtonId;
                this.excludedTrialsContainer[this.group].appendChild(button);
        
                // Add event listener to the button for quick navigation
                button.addEventListener('click', () => {
                    this.trialSlider.value = parseInt(trialButtonId.split('-')[2]);
                    this.trialSlider.dispatchEvent(new Event('input'));
                });
            }
            
            this.excludeTrialButton.classList.toggle('active');
            this.getData();
        });
            
          
        this.containers= ['#container1', '#container2', '#container3'];
        
        this.yAxisLabel.style.display = 'none'; // Hide "Frequency" y-axis-label while Loading...
        this.colorbarLabel.style.display = "none" // Hide "Power" colorbar-label while Loading...
        this.channelDisplay.textContent = 'Channel 1' 
        this.trialSlider.disabled=true
        
        this.prevChan.addEventListener('click', () => {
        if (this.channel > 1) {
                this.channel--;
                this.channelDisplay.textContent = 'Channel' + this.channel;
                this.getData();
            }
        })
        
        this.nextChan.addEventListener('click', () => {
            this.channel++;
            this.channelDisplay.textContent = 'Channel' + this.channel;
            this.getData();
        })
 
        this.meanTrialsButton.addEventListener('click', () => {
            this.meanTrials = !this.meanTrials; 
            this.ANOVAbutton.disabled = this.meanTrials; 
            this.excludeTrialButton.disabled = !this.excludeTrialButton.disabled
            this.meanTrialsButton.classList.toggle('active'); 
        
            this.trial = 1;
            this.getData();
        });
        
        this.ANOVAbutton.addEventListener('click', () => {
            this.ANOVA = !this.ANOVA; 
            this.meanTrialsButton.disabled = this.ANOVA; 
            this.ANOVAbutton.classList.toggle('active');
            this.excludeTrialButton.disabled = !this.excludeTrialButton.disabled
            document.querySelectorAll('.groupButton').forEach(button => {
                if (button.textContent !== this.group) {
                    button.classList.toggle('active');
                }
                button.disabled = !button.disabled;
            });
            
            if (this.ANOVA) {
                this.pVal.style.display = 'inline-block'; 
                this.pVal.focus();
            } else {
                this.pVal.style.display = 'none'; 
            }
        
            this.trial = 1;
            this.getData();
        });
        
        
        
        const groupButtons = document.querySelectorAll('.groupButton');
        groupButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                groupButtons.forEach(btn => btn.classList.remove('active'));
        
                event.target.classList.add('active'); 
        
                this.group = event.target.textContent;
                this.trial = 1;

                const allContainers = document.querySelectorAll('.excluded-trials-container');
                allContainers.forEach(container => container.style.display = 'none');
            
                const currentContainer = document.getElementById(`excludedTrialsContainer${this.group}`);
                currentContainer.style.display = 'block';
                this.getData();
            });
        })
    }


    async getData() {
        
        this.trialSlider.disabled = true; // Disable trial slider while loading data
        this.loadingText.style.display = "block";  // Display "Loading..." while data loads
        
        const args = {
            group: this.group,
            channel: this.channel,
            meanTrials: this.meanTrials,
            ANOVA: this.ANOVA,
            allGroups: this.allGroups,
            excludedTrialsContainer: this.excludedTrialsContainer        
        }

        const response = await fetch(`https://froyzen.pythonanywhere.com/`, {
        // const response = await fetch(`http://localhost:5000/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
        })
        const responseData = await response.json();
        
        this.allWaveletTrials = responseData.trialsWavelet
        this.allLFPTrials = responseData.trialsLFP
        // this.allTrialsData = responseData.trials_data;
        this.singleTrialWavelet = this.allWaveletTrials[this.trial];
        this.singleTrialLFP = this.allLFPTrials[this.trial];
        console.log(this.singleTrialLFP)
        // this.singleTrialData = this.allTrialsData[this.trial];
        
        this.trialNumber.textContent = this.trial
        this.trialSlider.value = this.trial
        this.trialSlider.max = Object.keys(this.allWaveletTrials).length;
        this.trialSlider.disabled = false;

        this.loadingText.style.display = "none";  // Hide "Loading..."
        this.yAxisLabel.style.display = "block" // Display "Frequency"
        this.colorbarLabel.style.display = "block" // Display "Power"
        
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
        const LFPchart = new window.LFPchart(this)
        LFPchart.initialize()
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

       if (this.ANOVA === true){
            heatmap.ANOVA =true
            heatmap.maxPower = this.pVal.value
            heatmap.colorScale = d3.scaleSequential(d3.interpolateViridis).domain([heatmap.maxPower,0])
            this.colorbarLabel.textContent = 'p-Value'
        }
        else {
            heatmap.ANOVA = false
            heatmap.maxPower = 3 * d3.deviation(this.getPowerValues(freqBin))
            heatmap.colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, heatmap.maxPower])
            this.colorbarLabel.innerHTML = 'Power  (uV / Hz<sup>2</sup>)'
        }
    }
} 

const page = new Page;
